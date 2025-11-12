"use client";

import { useState, useEffect } from "react";
import { Product, Transaction, Withdrawal } from "@/types";
import {
  getProducts,
  saveProduct,
  deleteProduct,
  getTransactions,
  saveTransaction,
  deleteTransaction,
  saveProducts,
  saveTransactions,
  getWithdrawals,
  saveWithdrawal,
  deleteWithdrawal,
} from "@/lib/storageSupabase";
import { calculateDashboardStats, formatCurrency } from "@/lib/utils";
import StatsCard from "@/components/StatsCard";
import ProductForm from "@/components/ProductForm";
import ProductList from "@/components/ProductList";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import CSVImport from "@/components/CSVImport";
import ExcelImport from "@/components/ExcelImport";
import ShopeeExcelImport from "@/components/ShopeeExcelImport";

type TabType = "dashboard" | "reports" | "excel" | "pdf";

type PlatformFilter = "all" | "tiktok" | "shopee";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [reportPlatformFilter, setReportPlatformFilter] =
    useState<PlatformFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Withdrawal states
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawalDate, setWithdrawalDate] = useState("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalStartPeriod, setWithdrawalStartPeriod] = useState("");
  const [withdrawalEndPeriod, setWithdrawalEndPeriod] = useState("");
  const [withdrawalNotes, setWithdrawalNotes] = useState("");

  // PIN Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // PIN Configuration - ubah sesuai keinginan
  const CORRECT_PIN = "2001"; // ⚠️ Ganti dengan PIN Anda!

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = sessionStorage.getItem("saanja_authenticated");
      if (authStatus === "true") {
        setIsAuthenticated(true);
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  // Load data on mount (only after authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadData() {
      setIsLoading(true);
      try {
        const [productsData, transactionsData, withdrawalsData] =
          await Promise.all([
            getProducts(),
            getTransactions(),
            getWithdrawals(),
          ]);
        setProducts(productsData);
        setTransactions(transactionsData);
        setWithdrawals(withdrawalsData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [isAuthenticated]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [reportPlatformFilter, startDate, endDate]);

  // Handle PIN submission
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (pinInput === CORRECT_PIN) {
      sessionStorage.setItem("saanja_authenticated", "true");
      setIsAuthenticated(true);
      setPinError("");
      setPinInput("");
    } else {
      setPinError("❌ PIN salah! Coba lagi.");
      setPinInput("");

      // Clear error after 3 seconds
      setTimeout(() => setPinError(""), 3000);
    }
  };

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem("saanja_authenticated");
    setIsAuthenticated(false);
    setPinInput("");
  };

  const handleSaveProduct = async (product: Product) => {
    await saveProduct(product);
    const updatedProducts = await getProducts();
    setProducts(updatedProducts);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteProduct(id);
    const updatedProducts = await getProducts();
    setProducts(updatedProducts);
  };

  const handleSaveTransaction = async (transaction: Transaction) => {
    await saveTransaction(transaction);
    const updatedTransactions = await getTransactions();
    setTransactions(updatedTransactions);
    setActiveTab("dashboard");
  };

  const handleDeleteTransaction = async (id: string) => {
    await deleteTransaction(id);
    const updatedTransactions = await getTransactions();
    setTransactions(updatedTransactions);
  };

  const handleCSVImport = async (
    importedProducts: Product[],
    importedTransactions: Transaction[]
  ) => {
    // Save all products
    await saveProducts(importedProducts);
    setProducts(importedProducts);

    // Merge with existing transactions
    const existingTransactions = await getTransactions();
    const allTransactions = [...importedTransactions, ...existingTransactions];
    await saveTransactions(allTransactions);
    setTransactions(allTransactions);

    // Switch to dashboard to see results
    setActiveTab("dashboard");
  };

  // Withdrawal handlers
  const handleSaveWithdrawal = async () => {
    if (!withdrawalDate || !withdrawalAmount) {
      alert("Tanggal dan jumlah penarikan harus diisi!");
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Jumlah penarikan tidak valid!");
      return;
    }

    try {
      const newWithdrawal: Withdrawal = {
        id: `withdrawal-${Date.now()}`,
        date: withdrawalDate,
        amount,
        startPeriod: withdrawalStartPeriod || undefined,
        endPeriod: withdrawalEndPeriod || undefined,
        notes: withdrawalNotes || undefined,
        createdAt: new Date().toISOString(),
      };

      console.log("💾 Saving withdrawal:", newWithdrawal);
      const success = await saveWithdrawal(newWithdrawal);

      if (!success) {
        alert("❌ Gagal menyimpan penarikan. Silakan coba lagi.");
        return;
      }

      console.log("✅ Withdrawal saved, fetching updated list...");
      const updated = await getWithdrawals();
      console.log("📋 Updated withdrawals:", updated);
      setWithdrawals(updated);

      // Reset form
      setWithdrawalDate("");
      setWithdrawalAmount("");
      setWithdrawalStartPeriod("");
      setWithdrawalEndPeriod("");
      setWithdrawalNotes("");
      setShowWithdrawalForm(false);

      alert("✅ Penarikan berhasil dicatat!");
    } catch (error) {
      console.error("❌ Error in handleSaveWithdrawal:", error);
      alert("❌ Terjadi kesalahan. Silakan coba lagi.");
    }
  };

  const handleDeleteWithdrawal = async (id: string) => {
    if (confirm("Hapus data penarikan ini?")) {
      await deleteWithdrawal(id);
      const updated = await getWithdrawals();
      setWithdrawals(updated);
    }
  };

  // Filter transactions by platform
  const filterTransactionsByPlatform = (
    transactions: Transaction[],
    platform: PlatformFilter
  ): Transaction[] => {
    if (platform === "all") return transactions;

    return transactions.filter((t) => {
      // Check if transaction is from Shopee
      const isShopee =
        t.productName.toLowerCase().includes("shopee") ||
        (t.notes && t.notes.toLowerCase().includes("shopee"));

      const isTikTok = !isShopee;

      if (platform === "shopee") return isShopee;
      if (platform === "tiktok") return isTikTok;
      return true;
    });
  };

  const filteredTransactionsByPlatform = filterTransactionsByPlatform(
    transactions,
    platformFilter
  );
  const stats = calculateDashboardStats(filteredTransactionsByPlatform);

  // Apply platform filter first
  const platformFilteredForReports = filterTransactionsByPlatform(
    transactions,
    reportPlatformFilter
  );

  // Then apply date filter and sort
  const filteredTransactions =
    startDate || endDate
      ? [...platformFilteredForReports]
          .filter((t) => {
            const transactionDate = new Date(t.date);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            if (start && end) {
              return transactionDate >= start && transactionDate <= end;
            } else if (start) {
              return transactionDate >= start;
            } else if (end) {
              return transactionDate <= end;
            }
            return true;
          })
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
      : [...platformFilteredForReports].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

  const tabs = [
    { id: "dashboard" as TabType, label: "📊 Dashboard", icon: "📊" },
    { id: "reports" as TabType, label: "📈 Laporan", icon: "📈" },
    { id: "excel" as TabType, label: "🎵 TikTok Shop (Excel)", icon: "🎵" },
    { id: "pdf" as TabType, label: "🛍️ Shopee (Excel)", icon: "🛍️" },
  ];

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show PIN screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* PIN Card */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Logo/Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-3">
                <span className="text-3xl">💼</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Saanja App</h1>
              <p className="text-sm text-gray-500 mt-1">
                Masukkan PIN untuk akses
              </p>
            </div>

            {/* PIN Form */}
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pinInput}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  setPinInput(value);
                }}
                maxLength={6}
                placeholder="Masukkan PIN (angka)"
                className="w-full px-4 py-3 text-center text-xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono placeholder:text-gray-400 text-gray-900"
                autoFocus
                required
              />

              {/* Error Message */}
              {pinError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg animate-shake">
                  <p className="text-red-700 text-sm text-center">{pinError}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={pinInput.length === 0}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  pinInput.length === 0
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                🔓 Masukkan PIN
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-xs text-gray-400 mt-6">
              Made with ❤️ for Saanja Seller
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main App (authenticated)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                💼 Saanja App
              </h1>
              <p className="text-gray-600 mt-1">
                Pencatatan Keuntungan Produk Harian
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm flex items-center gap-2"
              title="Logout"
            >
              <span>🔒</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">
                Loading data from Supabase...
              </p>
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {!isLoading && activeTab === "dashboard" && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Ringkasan Keuntungan
                </h2>

                {/* Platform Filter */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">
                    Platform:
                  </label>
                  <select
                    value={platformFilter}
                    onChange={(e) =>
                      setPlatformFilter(e.target.value as PlatformFilter)
                    }
                    className="px-4 py-2 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium text-sm shadow-sm hover:border-blue-400 cursor-pointer"
                  >
                    <option value="all" className="text-gray-900 bg-white">
                      🌐 Semua Platform
                    </option>
                    <option value="tiktok" className="text-gray-900 bg-white">
                      🎵 TikTok Shop
                    </option>
                    <option value="shopee" className="text-gray-900 bg-white">
                      🛍️ Shopee
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                  title="Hari Ini"
                  value={formatCurrency(stats.todayProfit)}
                  icon="📅"
                  color="blue"
                />
                <StatsCard
                  title="Minggu Ini"
                  value={formatCurrency(stats.weekProfit)}
                  icon="📆"
                  color="green"
                />
                <StatsCard
                  title="Bulan Ini"
                  value={formatCurrency(stats.monthProfit)}
                  icon="📊"
                  color="purple"
                />
                <StatsCard
                  title="Total Transaksi"
                  value={stats.totalTransactions.toString()}
                  icon="💼"
                  color="orange"
                />
              </div>

              {/* Platform Info Badge */}
              {platformFilter !== "all" && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Filter Aktif:
                      </p>
                      <p className="text-lg font-bold text-blue-900 mt-1">
                        {platformFilter === "tiktok"
                          ? "🎵 TikTok Shop"
                          : "🛍️ Shopee"}
                      </p>
                    </div>
                    <button
                      onClick={() => setPlatformFilter("all")}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                    >
                      Lihat Semua
                    </button>
                  </div>
                </div>
              )}

              {/* Platform Breakdown when "all" selected */}
              {platformFilter === "all" && transactions.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {/* TikTok Shop Stats */}
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700">
                        🎵 TikTok Shop
                      </h3>
                      <button
                        onClick={() => setPlatformFilter("tiktok")}
                        className="text-xs text-green-700 hover:text-green-900 font-medium"
                      >
                        Detail →
                      </button>
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(
                        calculateDashboardStats(
                          filterTransactionsByPlatform(transactions, "tiktok")
                        ).monthProfit
                      )}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      {
                        filterTransactionsByPlatform(transactions, "tiktok")
                          .length
                      }{" "}
                      transaksi bulan ini
                    </p>
                  </div>

                  {/* Shopee Stats */}
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700">
                        🛍️ Shopee
                      </h3>
                      <button
                        onClick={() => setPlatformFilter("shopee")}
                        className="text-xs text-purple-700 hover:text-purple-900 font-medium"
                      >
                        Detail →
                      </button>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatCurrency(
                        calculateDashboardStats(
                          filterTransactionsByPlatform(transactions, "shopee")
                        ).monthProfit
                      )}
                    </p>
                    <p className="text-xs text-purple-700 mt-1">
                      {
                        filterTransactionsByPlatform(transactions, "shopee")
                          .length
                      }{" "}
                      transaksi bulan ini
                    </p>
                  </div>
                </div>
              )}
            </div>

            {transactions.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                <p className="text-blue-800 text-lg font-medium">
                  👋 Selamat datang!
                </p>
                <p className="text-blue-600 mt-2">
                  Mulai dengan import data dari:
                </p>
                <div className="flex gap-4 justify-center mt-3">
                  <div className="text-blue-700">
                    <strong>🎵 TikTok Shop</strong> → Import Excel Income
                  </div>
                  <div className="text-blue-700">
                    <strong>🛍️ Shopee</strong> → Import Excel Income
                  </div>
                </div>
              </div>
            )}

            {/* Withdrawal Section */}
            {transactions.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    💰 Riwayat Penarikan
                  </h2>
                  <button
                    onClick={() => setShowWithdrawalForm(!showWithdrawalForm)}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition-all font-medium text-sm"
                  >
                    {showWithdrawalForm ? "❌ Batal" : "+ Catat Penarikan"}
                  </button>
                </div>

                {/* Withdrawal Form */}
                {showWithdrawalForm && (
                  <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold text-gray-900">
                      Catat Penarikan Baru
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          📅 Tanggal Penarikan *
                        </label>
                        <input
                          type="date"
                          value={withdrawalDate}
                          onChange={(e) => setWithdrawalDate(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          💵 Jumlah Ditarik (Rp) *
                        </label>
                        <input
                          type="number"
                          value={withdrawalAmount}
                          onChange={(e) => setWithdrawalAmount(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder:text-gray-400"
                          placeholder="500000"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          📊 Periode Profit - Dari
                        </label>
                        <input
                          type="date"
                          value={withdrawalStartPeriod}
                          onChange={(e) =>
                            setWithdrawalStartPeriod(e.target.value)
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          📊 Periode Profit - Sampai
                        </label>
                        <input
                          type="date"
                          value={withdrawalEndPeriod}
                          onChange={(e) =>
                            setWithdrawalEndPeriod(e.target.value)
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        📝 Catatan (Optional)
                      </label>
                      <textarea
                        value={withdrawalNotes}
                        onChange={(e) => setWithdrawalNotes(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder:text-gray-400"
                        rows={2}
                        placeholder="Transfer ke Bank BCA..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveWithdrawal}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        💾 Simpan Penarikan
                      </button>
                      <button
                        onClick={() => setShowWithdrawalForm(false)}
                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-xs text-green-600 font-medium mb-1">
                      Total Profit
                    </p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(
                        filteredTransactionsByPlatform
                          .filter((t) => !t.notes?.includes("RETURN"))
                          .reduce((sum, t) => sum + t.profit, 0)
                      )}
                    </p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-xs text-orange-600 font-medium mb-1">
                      Sudah Ditarik
                    </p>
                    <p className="text-2xl font-bold text-orange-700">
                      {formatCurrency(
                        withdrawals.reduce((sum, w) => sum + w.amount, 0)
                      )}
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-600 font-medium mb-1">
                      Sisa Tersedia
                    </p>
                    <p className="text-2xl font-bold text-blue-700">
                      {formatCurrency(
                        filteredTransactionsByPlatform
                          .filter((t) => !t.notes?.includes("RETURN"))
                          .reduce((sum, t) => sum + t.profit, 0) -
                          withdrawals.reduce((sum, w) => sum + w.amount, 0)
                      )}
                    </p>
                  </div>
                </div>

                {/* Withdrawal History */}
                {withdrawals.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-500">
                      📊 Belum ada riwayat penarikan
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Klik tombol "Catat Penarikan" untuk mulai mencatat
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      📊 Timeline Penarikan
                    </h3>
                    {withdrawals.map((withdrawal) => (
                      <div
                        key={withdrawal.id}
                        className="flex items-start gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">
                                💰 {formatCurrency(withdrawal.amount)}
                              </p>
                              <p className="text-sm text-gray-600">
                                📅{" "}
                                {new Date(withdrawal.date).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  }
                                )}
                              </p>
                              {(withdrawal.startPeriod ||
                                withdrawal.endPeriod) && (
                                <p className="text-xs text-gray-500 mt-1">
                                  📊 Periode:{" "}
                                  {withdrawal.startPeriod &&
                                    new Date(
                                      withdrawal.startPeriod
                                    ).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  {withdrawal.startPeriod &&
                                    withdrawal.endPeriod &&
                                    " - "}
                                  {withdrawal.endPeriod &&
                                    new Date(
                                      withdrawal.endPeriod
                                    ).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                </p>
                              )}
                              {withdrawal.notes && (
                                <p className="text-xs text-gray-500 mt-1">
                                  📝 {withdrawal.notes}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                handleDeleteWithdrawal(withdrawal.id)
                              }
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {!isLoading && activeTab === "reports" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Filter Laporan
              </h2>

              {/* Platform Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform
                </label>
                <select
                  value={reportPlatformFilter}
                  onChange={(e) =>
                    setReportPlatformFilter(e.target.value as PlatformFilter)
                  }
                  className="w-full px-4 py-2 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium shadow-sm hover:border-blue-400 cursor-pointer"
                >
                  <option value="all">🌐 Semua Platform</option>
                  <option value="tiktok">🎵 TikTok Shop</option>
                  <option value="shopee">🛍️ Shopee</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dari Tanggal
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium shadow-sm hover:border-blue-400 cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium shadow-sm hover:border-blue-400 cursor-pointer"
                  />
                </div>
                {(startDate || endDate) && (
                  <button
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                  >
                    Reset Tanggal
                  </button>
                )}
              </div>
              {/* Filter Info */}
              {(reportPlatformFilter !== "all" || startDate || endDate) && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-blue-800 mb-1">
                        <strong>Filter Aktif:</strong>
                      </p>
                      {reportPlatformFilter !== "all" && (
                        <p className="text-sm text-blue-700 mb-1">
                          📱 Platform:{" "}
                          {reportPlatformFilter === "tiktok"
                            ? "🎵 TikTok Shop"
                            : "🛍️ Shopee"}
                        </p>
                      )}
                      {(startDate || endDate) && (
                        <p className="text-sm text-blue-700 mb-1">
                          📅 Tanggal:
                          {startDate && endDate
                            ? ` ${new Date(startDate).toLocaleDateString(
                                "id-ID"
                              )} - ${new Date(endDate).toLocaleDateString(
                                "id-ID"
                              )}`
                            : startDate
                            ? ` Dari ${new Date(startDate).toLocaleDateString(
                                "id-ID"
                              )}`
                            : ` Sampai ${new Date(endDate).toLocaleDateString(
                                "id-ID"
                              )}`}
                        </p>
                      )}
                      <p className="text-sm text-blue-800 font-semibold mt-2">
                        📊 Menampilkan {filteredTransactions.length} transaksi
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setReportPlatformFilter("all");
                        setStartDate("");
                        setEndDate("");
                      }}
                      className="ml-4 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      Reset Semua Filter
                    </button>
                  </div>
                </div>
              )}

              {/* Summary Statistics - Always Show */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-1">
                    Total Penghasilan
                  </p>
                  <p className="text-xl font-bold text-blue-700">
                    {formatCurrency(
                      filteredTransactions
                        .filter(
                          (t) => !t.notes?.includes("RETURN") && t.quantity > 0
                        )
                        .reduce((sum, t) => {
                          const omzet = t.sellPrice * t.quantity;
                          return isNaN(omzet) || !isFinite(omzet)
                            ? sum
                            : sum + omzet;
                        }, 0)
                    )}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 font-medium mb-1">
                    Total Qty
                  </p>
                  <p className="text-xl font-bold text-gray-700">
                    {filteredTransactions
                      .filter(
                        (t) => !t.notes?.includes("RETURN") && t.quantity > 0
                      )
                      .reduce((sum, t) => sum + t.quantity, 0)}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-xs text-red-600 font-medium mb-1">
                    Total Modal
                  </p>
                  <p className="text-xl font-bold text-red-700">
                    {formatCurrency(
                      filteredTransactions
                        .filter(
                          (t) => !t.notes?.includes("RETURN") && t.quantity > 0
                        )
                        .reduce((sum, t) => {
                          const modal = t.buyPrice * t.quantity;
                          return isNaN(modal) || !isFinite(modal)
                            ? sum
                            : sum + modal;
                        }, 0)
                    )}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 font-medium mb-1">
                    Total Profit
                  </p>
                  <p className="text-xl font-bold text-green-700">
                    {formatCurrency(
                      filteredTransactions
                        .filter(
                          (t) => !t.notes?.includes("RETURN") && t.quantity > 0
                        )
                        .reduce((sum, t) => {
                          const profit = t.profit;
                          return isNaN(profit) || !isFinite(profit)
                            ? sum
                            : sum + profit;
                        }, 0)
                    )}
                  </p>
                </div>
              </div>

              {/* Return Items Info */}
              {(() => {
                const returnCount = filteredTransactions.filter(
                  (t) => t.notes?.includes("RETURN") || t.quantity === 0
                ).length;

                if (returnCount > 0) {
                  return (
                    <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                      <p className="text-sm text-red-800 font-semibold">
                        🔄 Return Items Detected
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Ditemukan <strong>{returnCount}</strong> item
                        return/refund dalam periode ini. Item ini tidak dihitung
                        dalam statistik di atas.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {startDate || endDate
                  ? startDate && endDate
                    ? `Transaksi ${new Date(startDate).toLocaleDateString(
                        "id-ID"
                      )} - ${new Date(endDate).toLocaleDateString("id-ID")}`
                    : startDate
                    ? `Transaksi mulai ${new Date(startDate).toLocaleDateString(
                        "id-ID"
                      )}`
                    : `Transaksi sampai ${new Date(endDate).toLocaleDateString(
                        "id-ID"
                      )}`
                  : "Semua Transaksi"}
              </h2>

              {/* Pagination Info */}
              {(() => {
                const totalPages = Math.ceil(
                  filteredTransactions.length / itemsPerPage
                );
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedTransactions = filteredTransactions.slice(
                  startIndex,
                  endIndex
                );

                return (
                  <>
                    {/* Transaction List */}
                    <TransactionList
                      transactions={paginatedTransactions}
                      onDelete={handleDeleteTransaction}
                    />

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="mt-6 border-t border-gray-200 pt-4">
                        {/* Info Text */}
                        <div className="text-sm text-gray-600 mb-4">
                          Menampilkan {startIndex + 1} -{" "}
                          {Math.min(endIndex, filteredTransactions.length)} dari{" "}
                          {filteredTransactions.length} transaksi
                        </div>

                        {/* Pagination Numbers */}
                        <div className="flex items-center justify-center gap-2">
                          {/* Previous Button */}
                          <button
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(1, prev - 1))
                            }
                            disabled={currentPage === 1}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium transition-all ${
                              currentPage === 1
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            ‹
                          </button>

                          {/* Page Numbers */}
                          {(() => {
                            const pages = [];
                            const showEllipsisStart = currentPage > 3;
                            const showEllipsisEnd =
                              currentPage < totalPages - 2;

                            // First page
                            pages.push(
                              <button
                                key={1}
                                onClick={() => setCurrentPage(1)}
                                className={`w-10 h-10 flex items-center justify-center rounded-full font-medium transition-all ${
                                  currentPage === 1
                                    ? "bg-blue-500 text-white shadow-lg"
                                    : "text-gray-700 hover:bg-gray-100"
                                }`}
                              >
                                1
                              </button>
                            );

                            // Ellipsis after first page
                            if (showEllipsisStart) {
                              pages.push(
                                <span
                                  key="ellipsis-start"
                                  className="text-gray-400 px-2"
                                >
                                  ...
                                </span>
                              );
                            }

                            // Pages around current page
                            const startPage = Math.max(2, currentPage - 1);
                            const endPage = Math.min(
                              totalPages - 1,
                              currentPage + 1
                            );

                            for (let i = startPage; i <= endPage; i++) {
                              pages.push(
                                <button
                                  key={i}
                                  onClick={() => setCurrentPage(i)}
                                  className={`w-10 h-10 flex items-center justify-center rounded-full font-medium transition-all ${
                                    currentPage === i
                                      ? "bg-blue-500 text-white shadow-lg"
                                      : "text-gray-700 hover:bg-gray-100"
                                  }`}
                                >
                                  {i}
                                </button>
                              );
                            }

                            // Ellipsis before last page
                            if (showEllipsisEnd) {
                              pages.push(
                                <span
                                  key="ellipsis-end"
                                  className="text-gray-400 px-2"
                                >
                                  ...
                                </span>
                              );
                            }

                            // Last page (if more than 1 page)
                            if (totalPages > 1) {
                              pages.push(
                                <button
                                  key={totalPages}
                                  onClick={() => setCurrentPage(totalPages)}
                                  className={`w-10 h-10 flex items-center justify-center rounded-full font-medium transition-all ${
                                    currentPage === totalPages
                                      ? "bg-blue-500 text-white shadow-lg"
                                      : "text-gray-700 hover:bg-gray-100"
                                  }`}
                                >
                                  {totalPages}
                                </button>
                              );
                            }

                            return pages;
                          })()}

                          {/* Next Button */}
                          <button
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(totalPages, prev + 1)
                              )
                            }
                            disabled={currentPage === totalPages}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium transition-all ${
                              currentPage === totalPages
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            ›
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Import Excel Tab */}
        {!isLoading && activeTab === "excel" && (
          <div>
            <ExcelImport products={products} onImport={handleCSVImport} />
          </div>
        )}

        {/* Import Shopee Excel Tab */}
        {!isLoading && activeTab === "pdf" && (
          <div>
            <ShopeeExcelImport products={products} onImport={handleCSVImport} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 text-sm">
            💼 Saanja App - Pencatatan Keuntungan Produk Harian
          </p>
        </div>
      </footer>
    </div>
  );
}
