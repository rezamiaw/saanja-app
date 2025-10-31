"use client";

import { useState } from "react";
import { Product } from "@/types";
import { parseTikTokPDF, importPDFData, PDFIncomeData } from "@/lib/pdfParser";
import { formatCurrency } from "@/lib/utils";

interface PDFImportProps {
  products: Product[];
  onImport: (products: Product[], transactions: any[]) => void;
}

export default function PDFImport({ products, onImport }: PDFImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PDFIncomeData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [defaultCost, setDefaultCost] = useState<string>("59000");
  const [settlementPerItem, setSettlementPerItem] = useState<string>("98125");
  const [importStats, setImportStats] = useState<{
    newProducts: number;
    newTransactions: number;
    totalProfit: number;
  } | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".pdf")) {
      setErrors(["File harus berformat .pdf"]);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setPreviewData([]);
    setImportStats(null);

    try {
      console.log("🚀 Starting PDF import...");
      const result = await parseTikTokPDF(selectedFile);

      console.log("📊 Parse Result:", result);
      console.log("   - Success:", result.success);
      console.log("   - Total Rows:", result.totalRows);
      console.log("   - Data Length:", result.data.length);
      console.log("   - Errors:", result.errors);

      const debugMessages = [
        `Total Rows: ${result.totalRows}`,
        `Success: ${result.success}`,
        `Data Found: ${result.data.length}`,
        `Errors: ${result.errors.length}`,
      ];
      setDebugInfo(debugMessages);

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
          "1. Pastikan file adalah PDF dari TikTok Shop Weekly Report",
          "2. Buka Console (F12) untuk melihat detail error dan extracted text",
          "3. Cek apakah PDF berisi kolom 'Tanggal Dana Dilepaskan' dan 'Subtotal Pesanan'",
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
        "❌ Gagal membaca file PDF:",
        (error as Error).message || "Unknown error",
        "",
        "💡 Kemungkinan penyebab:",
        "1. File PDF corrupt atau tidak valid",
        "2. Browser tidak support PDF parsing",
        "3. File terlalu besar",
        "",
        "Buka Console (F12) untuk detail lengkap.",
      ]);
    }
  };

  const handleImport = () => {
    if (previewData.length === 0) return;

    setImporting(true);

    try {
      const cost = parseFloat(defaultCost) || 59000;
      const settlement = parseFloat(settlementPerItem) || 98125;

      // Recalculate quantity for each preview data
      const updatedData = previewData.map((row) => ({
        ...row,
        quantity: Math.round(row.settlementAmount / settlement) || 1,
      }));

      const result = importPDFData(updatedData, products, cost);
      setImportStats(result.stats);
      onImport(result.products, result.transactions);

      setTimeout(() => {
        setFile(null);
        setPreviewData([]);
        setImportStats(null);
        setErrors([]);
        setImporting(false);
      }, 3000);
    } catch (error) {
      setErrors(["Gagal mengimport data"]);
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData([]);
    setErrors([]);
    setImportStats(null);
  };

  const cost = parseFloat(defaultCost) || 59000;
  const settlement = parseFloat(settlementPerItem) || 98125;

  const totalSettlement = previewData.reduce(
    (sum, row) => sum + row.settlementAmount,
    0
  );
  const totalCost = previewData.reduce((sum, row) => {
    const actualQty = Math.round(row.settlementAmount / settlement) || 1;
    return sum + cost * actualQty;
  }, 0);
  const estimatedProfit = totalSettlement - totalCost;

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>🛍️</span>
          <span>Import Shopee - Weekly Report PDF</span>
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Khusus untuk Shopee Seller. Import file PDF Weekly Report dari Shopee
          Income.
        </p>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="pdf-file"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Upload File PDF
            </label>
            <input
              id="pdf-file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-purple-50 file:text-purple-700
                hover:file:bg-purple-100
                cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-2">
              Format: PDF Weekly Report dari Shopee Seller Center
            </p>
          </div>

          {/* Input Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Harga Modal per Item
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">Rp</span>
                <input
                  type="number"
                  value={defaultCost}
                  onChange={(e) => setDefaultCost(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="59000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Harga modal per 1 item produk
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Settlement Amount per Item
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">Rp</span>
                <input
                  type="number"
                  value={settlementPerItem}
                  onChange={(e) => setSettlementPerItem(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="98125"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Untuk auto-detect quantity
              </p>
            </div>
          </div>

          {/* Quantity Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>💡 Cara menghitung quantity:</strong>
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Quantity = Total Settlement Amount ÷ Settlement per Item
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Contoh: Rp 196.250 ÷ Rp 98.125 = 2 items
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-medium text-purple-900 mb-2">
              📋 Cara Import Data Shopee:
            </h3>

            <ol className="text-sm text-purple-800 space-y-1 list-decimal list-inside">
              <li>
                Login ke <strong>Shopee Seller Center</strong>
              </li>
              <li>
                Buka menu <strong>Finance</strong> → <strong>Income</strong>
              </li>
              <li>Pilih periode (weekly/custom)</li>
              <li>
                Klik <strong>Download</strong> → pilih format{" "}
                <strong>PDF</strong>
              </li>
              <li>Upload file PDF di sini</li>
              <li>Set harga modal produk</li>
              <li>Klik Import Data</li>
            </ol>

            <div className="mt-3 pt-3 border-t border-purple-300">
              <p className="text-xs text-purple-700">
                <strong>📊 Data yang diambil:</strong>
              </p>
              <ul className="text-xs text-purple-700 mt-1 space-y-1">
                <li>
                  • <strong>Tanggal Dana Dilepaskan</strong> - untuk tanggal
                  transaksi
                </li>
                <li>
                  • <strong>Subtotal Pesanan</strong> - untuk settlement amount
                </li>
                <li>• Format: Daily summary (per tanggal)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      {debugInfo.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-900 mb-2">
            🔍 Debug Info (Buka Console F12 untuk detail):
          </h3>
          <ul className="text-sm text-yellow-800 space-y-1 font-mono">
            {debugInfo.map((info, index) => (
              <li key={index}>• {info}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-900 mb-2">⚠️ Error:</h3>
          <ul className="text-sm text-red-800 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Success Message */}
      {importStats && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-900 mb-2">
            ✅ Import Berhasil!
          </h3>
          <p className="text-sm text-green-800">
            • {importStats.newProducts} produk baru ditambahkan
          </p>
          <p className="text-sm text-green-800">
            • {importStats.newTransactions} transaksi berhasil diimport
          </p>
          <p className="text-sm text-green-800 font-bold mt-2">
            • Total Keuntungan: {formatCurrency(importStats.totalProfit)}
          </p>
        </div>
      )}

      {/* Preview */}
      {previewData.length > 0 && !importStats && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">
                Preview Data ({previewData.length} transaksi)
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {importing ? "Mengimport..." : "Import Data"}
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Settlement</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(totalSettlement)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Modal</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(totalCost)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estimasi Keuntungan</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(estimatedProfit)}
                </p>
              </div>
            </div>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Tanggal
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Order ID
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">
                    Qty
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">
                    Settlement
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">
                    Modal
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">
                    Keuntungan
                  </th>
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 10).map((row, index) => {
                  // Calculate actual quantity based on settlement per item
                  const settlement = parseFloat(settlementPerItem) || 98125;
                  const actualQty =
                    Math.round(row.settlementAmount / settlement) || 1;
                  const totalCost = cost * actualQty;
                  const profit = row.settlementAmount - totalCost;

                  return (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-2 px-3 text-gray-600">{row.date}</td>
                      <td className="py-2 px-3">
                        <p className="font-mono text-xs text-gray-900">
                          {row.orderId}
                        </p>
                      </td>
                      <td className="py-2 px-3 text-right text-gray-900">
                        {actualQty}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-900">
                        {formatCurrency(row.settlementAmount)}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {formatCurrency(totalCost)}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-purple-600">
                        {formatCurrency(profit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {previewData.length > 10 && (
              <p className="text-xs text-gray-500 text-center mt-3">
                Menampilkan 10 dari {previewData.length} transaksi
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
