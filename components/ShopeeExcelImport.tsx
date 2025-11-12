"use client";

import { useState } from "react";
import { Product, Transaction } from "@/types";
import {
  parseShopeeIncomeExcel,
  convertShopeeDataToTransactions,
  ShopeeExcelIncomeData,
} from "@/lib/shopeeExcelParser";
import { formatCurrency } from "@/lib/utils";

interface ShopeeExcelImportProps {
  products: Product[];
  onImport: (products: Product[], transactions: Transaction[]) => void;
}

export default function ShopeeExcelImport({
  products,
  onImport,
}: ShopeeExcelImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ShopeeExcelIncomeData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [defaultCost, setDefaultCost] = useState<string>("59000");
  const [settlementPerItem, setSettlementPerItem] = useState<string>("98125");
  const [importStats, setImportStats] = useState<{
    newProducts: number;
    newTransactions: number;
    totalProfit: number;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (
      !selectedFile.name.endsWith(".xlsx") &&
      !selectedFile.name.endsWith(".xls")
    ) {
      setErrors(["File harus berformat .xlsx atau .xls"]);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setPreviewData([]);
    setImportStats(null);

    try {
      console.log("🚀 Starting Shopee Excel import...");
      const result = await parseShopeeIncomeExcel(selectedFile);

      console.log("📊 Parse Result:", result);
      console.log("   - Success:", result.success);
      console.log("   - Total Rows:", result.totalRows);
      console.log("   - Data Length:", result.data.length);
      console.log("   - Errors:", result.errors);

      if (result.success) {
        console.log("✅ Parsing successful! Data:", result.data);
        setPreviewData(result.data);
        if (result.errors.length > 0) {
          setErrors(result.errors);
        }
      } else {
        console.error("❌ Parsing failed!");
        console.error("Errors:", result.errors);
        setErrors([
          ...result.errors,
          "",
          "💡 Tips:",
          "1. Pastikan file adalah Excel Income dari Shopee Seller Center",
          "2. Pastikan ada sheet 'Income'",
          "3. Pastikan ada kolom: No. Pesanan, Tanggal Dana Dilepaskan, Total Penghasilan",
        ]);
      }
    } catch (error) {
      console.error("❌ Unexpected Error:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      setErrors([
        `Error parsing Excel: ${
          error instanceof Error ? error.message : String(error)
        }`,
        "",
        "Pastikan:",
        "1. File adalah Excel (.xlsx) yang valid",
        "2. File dari Shopee Seller Center → Finance → Income → Export",
      ]);
    }
  };

  const handleImport = async () => {
    if (previewData.length === 0) {
      setErrors(["Tidak ada data untuk diimport"]);
      return;
    }

    const cost = parseFloat(defaultCost);
    const perItem = parseFloat(settlementPerItem);

    if (isNaN(cost) || cost < 0) {
      setErrors(["Harga modal tidak valid"]);
      return;
    }

    if (isNaN(perItem) || perItem <= 0) {
      setErrors(["Settlement per item tidak valid"]);
      return;
    }

    setImporting(true);
    setErrors([]);

    try {
      const { transactions, products: newProducts } =
        convertShopeeDataToTransactions(previewData, cost, perItem);

      console.log("📦 Generated Transactions:", transactions);
      console.log("📦 Generated Products:", newProducts);

      // Calculate stats
      const totalProfit = transactions.reduce(
        (sum, t) => sum + (t.profit || 0),
        0
      );

      setImportStats({
        newProducts: newProducts.length,
        newTransactions: transactions.length,
        totalProfit,
      });

      // Trigger import callback
      onImport(newProducts, transactions);

      console.log("✅ Import successful!");
    } catch (error) {
      console.error("❌ Import error:", error);
      setErrors([
        `Error saat import: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ]);
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData([]);
    setErrors([]);
    setImportStats(null);
  };

  // Calculate preview totals
  const calculatePreviewTotals = () => {
    const cost = parseFloat(defaultCost);
    const perItem = parseFloat(settlementPerItem);

    if (isNaN(cost) || isNaN(perItem) || perItem <= 0) {
      return {
        totalIncome: 0,
        totalCost: 0,
        totalProfit: 0,
        totalQuantity: 0,
        returnCount: 0,
      };
    }

    let totalIncome = 0;
    let totalCost = 0;
    let totalQuantity = 0;
    let returnCount = 0;

    previewData.forEach((item) => {
      // Check if this is a return item
      const isReturn = item.isReturn || item.totalIncome <= 0;

      if (isReturn) {
        returnCount++;
        // Don't include return items in totals
      } else {
        const qty = Math.round(item.totalIncome / perItem);
        totalIncome += item.totalIncome;
        totalCost += cost * qty;
        totalQuantity += qty;
      }
    });

    const totalProfit = totalIncome - totalCost;

    return { totalIncome, totalCost, totalProfit, totalQuantity, returnCount };
  };

  const previewTotals = calculatePreviewTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2">
          🛍️ Import Shopee - Excel Income
        </h2>
        <p className="text-orange-50">
          Khusus untuk Shopee Seller. Import file Excel Income dari Shopee
          Seller Center.
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h3 className="font-semibold text-blue-900 mb-2">📋 Cara Import:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>
            Login ke <strong>Shopee Seller Center</strong>
          </li>
          <li>
            Buka menu <strong>Keuangan</strong> →{" "}
            <strong>Penghasilan Saya</strong>
          </li>
          <li>
            Klik <strong>Sudah Dilepas</strong> → Pilih Tanggal → Klik{" "}
            <strong>Unduh</strong>
          </li>
          <li>Download file dan upload di sini</li>
          <li>Isi harga modal produk dan settlement per item</li>
          <li>
            Klik <strong>Import</strong>
          </li>
        </ol>
      </div>

      {/* File Upload */}
      <div className="bg-white p-6 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📂 Upload Excel Income Shopee (.xlsx)
        </label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-2"
        />
        {file && (
          <p className="mt-2 text-sm text-gray-600">
            ✅ File selected: <strong>{file.name}</strong> (
            {(file.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      {/* Cost Configuration */}
      {previewData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            ⚙️ Konfigurasi Harga
          </h3>

          {/* Product Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              💰 Harga Modal Produk (Rp)
            </label>
            <input
              type="number"
              value={defaultCost}
              onChange={(e) => setDefaultCost(e.target.value)}
              placeholder="59000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Harga modal per 1 produk (contoh: Rp 59.000)
            </p>
          </div>

          {/* Settlement Per Item */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📊 Settlement Amount per Item (Rp)
            </label>
            <input
              type="number"
              value={settlementPerItem}
              onChange={(e) => setSettlementPerItem(e.target.value)}
              placeholder="98125"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Penghasilan per 1 item. Digunakan untuk menghitung quantity
              otomatis.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              💡 Contoh: Total Penghasilan Rp 196.250 ÷ Rp 98.125 = 2 qty
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              <strong>📌 Catatan:</strong> Quantity akan dihitung otomatis
              berdasarkan{" "}
              <strong>Total Penghasilan ÷ Settlement per Item</strong>. Jika
              berbeda-beda di file yang sama, gunakan nilai rata-rata atau
              import terpisah per kategori produk.
            </p>
          </div>
        </div>
      )}

      {/* Preview Data */}
      {previewData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">
              📊 Preview Data ({previewData.length} order)
            </h3>
            <div className="text-sm text-gray-600">
              Settlement per item:{" "}
              <strong>{formatCurrency(parseFloat(settlementPerItem))}</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    No. Pesanan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total Penghasilan
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Modal
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Profit
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.slice(0, 10).map((item, index) => {
                  const cost = parseFloat(defaultCost);
                  const perItem = parseFloat(settlementPerItem);

                  // Check if this is a return item
                  const isReturn = item.isReturn || item.totalIncome <= 0;

                  const qty = isReturn
                    ? 0
                    : perItem > 0
                    ? Math.round(item.totalIncome / perItem)
                    : 1;
                  const totalCost = isReturn ? 0 : cost * qty;
                  const profit = isReturn ? 0 : item.totalIncome - totalCost;

                  return (
                    <tr
                      key={index}
                      className={`hover:bg-gray-50 ${
                        isReturn ? "bg-red-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-xs text-gray-900 font-mono">
                        {isReturn && (
                          <span className="inline-block mr-2 px-2 py-0.5 text-xs font-semibold text-red-700 bg-red-100 rounded">
                            🔄 RETURN
                          </span>
                        )}
                        {item.orderId}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.releaseDate}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">
                        {isReturn ? "-" : formatCurrency(item.totalIncome)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {isReturn ? "-" : qty}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">
                        {isReturn ? "-" : formatCurrency(totalCost)}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-semibold ${
                          isReturn
                            ? "text-gray-500"
                            : profit >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {isReturn ? "Rp 0" : formatCurrency(profit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {previewData.length > 10 && (
            <p className="text-sm text-gray-500 mt-3 text-center">
              ... dan {previewData.length - 10} order lainnya
            </p>
          )}

          {/* Summary */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-600 font-medium">
                Total Penghasilan
              </p>
              <p className="text-lg font-bold text-blue-700">
                {formatCurrency(previewTotals.totalIncome)}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 font-medium">Total Qty</p>
              <p className="text-lg font-bold text-gray-700">
                {previewTotals.totalQuantity}
              </p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-xs text-red-600 font-medium">Total Modal</p>
              <p className="text-lg font-bold text-red-700">
                {formatCurrency(previewTotals.totalCost)}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-green-600 font-medium">Total Profit</p>
              <p className="text-lg font-bold text-green-700">
                {formatCurrency(previewTotals.totalProfit)}
              </p>
            </div>
          </div>

          {/* Return Items Info */}
          {previewTotals.returnCount > 0 && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-sm text-red-800 font-semibold">
                🔄 Return Items Detected
              </p>
              <p className="text-sm text-red-700 mt-1">
                Ditemukan <strong>{previewTotals.returnCount}</strong> item
                return/refund. Item ini tidak dihitung dalam total profit.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <h3 className="font-semibold text-red-900 mb-2">❌ Error:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Success Stats */}
      {importStats && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <h3 className="font-semibold text-green-900 mb-2">
            ✅ Import Berhasil!
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-green-700">Produk Baru</p>
              <p className="text-2xl font-bold text-green-900">
                {importStats.newProducts}
              </p>
            </div>
            <div>
              <p className="text-green-700">Transaksi Baru</p>
              <p className="text-2xl font-bold text-green-900">
                {importStats.newTransactions}
              </p>
            </div>
            <div>
              <p className="text-green-700">Total Profit</p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(importStats.totalProfit)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {previewData.length > 0 && !importStats && (
          <button
            onClick={handleImport}
            disabled={importing}
            className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {importing ? "🔄 Importing..." : "📥 Import Data"}
          </button>
        )}
        {(previewData.length > 0 || importStats) && (
          <button
            onClick={handleReset}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
          >
            🔄 Reset
          </button>
        )}
      </div>
    </div>
  );
}
