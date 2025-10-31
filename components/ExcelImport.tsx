"use client";

import { useState } from "react";
import { Product } from "@/types";
import {
  parseTikTokIncomeExcel,
  importExcelIncomeData,
  ExcelIncomeData,
} from "@/lib/excelParser";
import { formatCurrency } from "@/lib/utils";

interface ExcelImportProps {
  products: Product[];
  onImport: (products: Product[], transactions: any[]) => void;
}

export default function ExcelImport({ products, onImport }: ExcelImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ExcelIncomeData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [defaultCost, setDefaultCost] = useState<string>("59000");
  const [settlementPerItem, setSettlementPerItem] = useState<string>("83218");
  const [importStats, setImportStats] = useState<{
    newProducts: number;
    newTransactions: number;
    totalProfit: number;
  } | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

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
      const result = await parseTikTokIncomeExcel(selectedFile);

      console.log("📊 Parse Result:", result);

      // Set debug info
      const debugMessages = [
        `Total Rows: ${result.totalRows}`,
        `Success: ${result.success}`,
        `Data Found: ${result.data.length}`,
      ];
      setDebugInfo(debugMessages);

      if (result.success) {
        setPreviewData(result.data);
        if (result.errors.length > 0) {
          setErrors(result.errors);
        }
      } else {
        setErrors([
          ...result.errors,
          "Tidak ada data yang bisa diparse. Cek browser console (F12) untuk detail.",
        ]);
        console.error("❌ Parsing failed:", result.errors);
      }
    } catch (error) {
      console.error("❌ Error:", error);
      setErrors([
        "Gagal membaca file Excel: " +
          ((error as Error).message || "Unknown error"),
        "Buka browser console (tekan F12) untuk melihat detail error.",
      ]);
    }
  };

  const handleImport = () => {
    if (previewData.length === 0) return;

    setImporting(true);

    try {
      const cost = parseFloat(defaultCost) || 59000;
      const settlementPrice = parseFloat(settlementPerItem) || 83218;

      // Recalculate quantities based on settlement per item
      const dataWithCorrectQty = previewData.map((row) => {
        const calculatedQty = Math.round(
          row.settlementAmount / settlementPrice
        );
        const actualQty = calculatedQty > 0 ? calculatedQty : row.quantity;
        return {
          ...row,
          quantity: actualQty,
        };
      });

      const result = importExcelIncomeData(dataWithCorrectQty, products, cost);
      setImportStats(result.stats);
      onImport(result.products, result.transactions);

      // Reset after successful import
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
  const settlementPrice = parseFloat(settlementPerItem) || 83218;

  // Filter out return items for calculation
  const nonReturnItems = previewData.filter(
    (row) => !row.isReturn && row.settlementAmount >= 0
  );
  const returnItems = previewData.filter(
    (row) => row.isReturn || row.settlementAmount < 0
  );

  const totalSettlement = nonReturnItems.reduce(
    (sum, row) => sum + row.settlementAmount,
    0
  );

  // Calculate total cost with recalculated quantities (excluding returns)
  const totalCost = nonReturnItems.reduce((sum, row) => {
    const calculatedQty = Math.round(row.settlementAmount / settlementPrice);
    const actualQty = calculatedQty > 0 ? calculatedQty : row.quantity;
    return sum + cost * actualQty;
  }, 0);

  const estimatedProfit = totalSettlement - totalCost;

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>🎵</span>
          <span>Import TikTok Shop - Excel Income</span>
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Khusus untuk TikTok Shop Seller. Import file Excel Income untuk
          tracking keuntungan.
        </p>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="excel-file"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Upload File Excel (.xlsx)
            </label>
            <input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-green-50 file:text-green-700
                hover:file:bg-green-100
                cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-2">
              Format: Excel Income dari TikTok Shop Seller Center
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="59000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Modal per 1 item produk
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="83218"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Settlement untuk 1 item (untuk hitung qty)
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 <strong>Cara hitung Quantity:</strong> Settlement Amount /
              Settlement per Item
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Contoh: Rp 166.436 / Rp 83.218 = 2 qty
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-2">
              📋 Cara Import Data:
            </h3>
            <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
              <li>Login ke TikTok Shop Seller Center</li>
              <li>Buka menu Finance → Income</li>
              <li>Klik tombol Export/Download</li>
              <li>Download file Excel</li>
              <li>Set harga modal produk (default Rp 59.000)</li>
              <li>Upload file Excel di sini</li>
            </ol>
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
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Preview Data ({previewData.length} transaksi)
                </h3>
                {returnItems.length > 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    🔄 {returnItems.length} item return (tidak dihitung profit)
                  </p>
                )}
              </div>
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
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {importing ? "Mengimport..." : "Import Data"}
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Total Settlement</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(totalSettlement)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {nonReturnItems.length} transaksi
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
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(estimatedProfit)}
                  </p>
                </div>
              </div>

              {/* Return Items Info */}
              {returnItems.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800">
                    🔄 Item Return
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    {returnItems.length} transaksi dikembalikan (tidak dihitung
                    profit)
                  </p>
                </div>
              )}
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
                  // Check if this is a return (negative settlement)
                  const isReturn = row.isReturn || row.settlementAmount < 0;

                  // Calculate quantity based on settlement per item
                  const settlementPrice =
                    parseFloat(settlementPerItem) || 83218;
                  const calculatedQty = Math.round(
                    Math.abs(row.settlementAmount) / settlementPrice
                  );
                  const actualQty =
                    calculatedQty > 0 ? calculatedQty : row.quantity;

                  // For return items, profit = 0 (not counted)
                  const totalCost = isReturn ? 0 : cost * actualQty;
                  const profit = isReturn
                    ? 0
                    : row.settlementAmount - totalCost;

                  return (
                    <tr
                      key={index}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        isReturn ? "bg-red-50" : ""
                      }`}
                    >
                      <td className="py-2 px-3 text-gray-600">{row.date}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-xs text-gray-900">
                            {row.orderId}
                          </p>
                          {isReturn && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                              🔄 RETURN
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {isReturn ? (
                          "-"
                        ) : (
                          <>
                            <span
                              className={
                                actualQty !== row.quantity
                                  ? "font-bold text-green-600"
                                  : ""
                              }
                            >
                              {actualQty}
                            </span>
                            {actualQty !== row.quantity && (
                              <span className="text-xs text-gray-500 ml-1">
                                (auto)
                              </span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {isReturn ? "-" : formatCurrency(row.settlementAmount)}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {isReturn ? "-" : formatCurrency(totalCost)}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-medium ${
                          isReturn ? "text-gray-500" : "text-green-600"
                        }`}
                      >
                        {isReturn ? "Rp 0" : formatCurrency(profit)}
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
