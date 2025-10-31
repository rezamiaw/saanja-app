"use client";

import { useState, useEffect } from "react";
import { Product, Transaction } from "@/types";
import {
  getProducts,
  saveProduct,
  deleteProduct,
  getTransactions,
  saveTransaction,
  deleteTransaction,
  saveProducts,
  saveTransactions,
} from "@/lib/storageSupabase";
import { calculateDashboardStats, formatCurrency } from "@/lib/utils";
import StatsCard from "@/components/StatsCard";
import ProductForm from "@/components/ProductForm";
import ProductList from "@/components/ProductList";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import CSVImport from "@/components/CSVImport";
import ExcelImport from "@/components/ExcelImport";
import dynamic from "next/dynamic";

// Dynamic import PDFImport to avoid SSR issues with PDF.js
const PDFImport = dynamic(() => import("@/components/PDFImport"), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <p className="text-gray-600">Loading PDF Import...</p>
    </div>
  ),
});

type TabType = "dashboard" | "reports" | "excel" | "pdf";

type PlatformFilter = "all" | "tiktok" | "shopee";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [isLoading, setIsLoading] = useState(true);

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
        const [productsData, transactionsData] = await Promise.all([
          getProducts(),
          getTransactions(),
        ]);
        setProducts(productsData);
        setTransactions(transactionsData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [isAuthenticated]);

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

  // Filter transactions by platform
  const filterTransactionsByPlatform = (
    transactions: Transaction[],
    platform: PlatformFilter
  ): Transaction[] => {
    if (platform === "all") return transactions;

    return transactions.filter((t) => {
      const isShopee =
        t.productName.includes("Shopee Daily") ||
        (t.notes && t.notes.includes("SHOPEE-"));
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

  const filteredTransactions = filterDate
    ? transactions.filter((t) => t.date === filterDate)
    : transactions;

  const tabs = [
    { id: "dashboard" as TabType, label: "📊 Dashboard", icon: "📊" },
    { id: "reports" as TabType, label: "📈 Laporan", icon: "📈" },
    { id: "excel" as TabType, label: "🎵 TikTok Shop (Excel)", icon: "🎵" },
    { id: "pdf" as TabType, label: "🛍️ Shopee (PDF)", icon: "🛍️" },
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* PIN Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-gray-200">
            {/* Logo/Icon */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
                <span className="text-4xl">💼</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Saanja App
              </h1>
              <p className="text-gray-600">Masukkan PIN untuk akses</p>
            </div>

            {/* PIN Form */}
            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIN Access Code
                </label>
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
                  className="w-full px-6 py-4 text-center text-2xl tracking-widest border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 font-mono bg-gray-50 placeholder:text-gray-400 text-gray-900"
                  autoFocus
                  required
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  💡 Gunakan angka saja (contoh: 1234)
                </p>
              </div>

              {/* Error Message */}
              {pinError && (
                <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg animate-shake">
                  <p className="text-red-800 text-sm font-medium text-center">
                    {pinError}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={pinInput.length === 0}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                  pinInput.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-xl transform hover:scale-105"
                }`}
              >
                {pinInput.length === 0 ? "🔒 Masukkan PIN" : "🔓 Unlock"}
              </button>
            </form>

            {/* Info */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                🔐 PIN disimpan di session browser Anda.
                <br />
                Akan hilang saat browser ditutup.
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Made with ❤️ for Saanja Seller
          </p>
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
                    <strong>🎵 TikTok Shop</strong> → Import Excel
                  </div>
                  <div className="text-blue-700">
                    <strong>🛍️ Shopee</strong> → Import PDF
                  </div>
                </div>
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
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter Tanggal
                  </label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium shadow-sm hover:border-blue-400 cursor-pointer"
                  />
                </div>
                {filterDate && (
                  <button
                    onClick={() => setFilterDate("")}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
              {filterDate && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Menampilkan {filteredTransactions.length} transaksi untuk
                    tanggal {new Date(filterDate).toLocaleDateString("id-ID")}
                  </p>
                  <p className="text-lg font-bold text-blue-900 mt-2">
                    Total Keuntungan:{" "}
                    {formatCurrency(
                      filteredTransactions.reduce((sum, t) => sum + t.profit, 0)
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {filterDate
                  ? `Transaksi pada ${new Date(filterDate).toLocaleDateString(
                      "id-ID"
                    )}`
                  : "Semua Transaksi"}
              </h2>
              <TransactionList
                transactions={filteredTransactions}
                onDelete={handleDeleteTransaction}
              />
            </div>
          </div>
        )}

        {/* Import Excel Tab */}
        {!isLoading && activeTab === "excel" && (
          <div>
            <ExcelImport products={products} onImport={handleCSVImport} />
          </div>
        )}

        {/* Import PDF Tab */}
        {!isLoading && activeTab === "pdf" && (
          <div>
            <PDFImport products={products} onImport={handleCSVImport} />
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
