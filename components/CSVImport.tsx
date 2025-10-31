"use client";

import { useState } from "react";
import { Product } from "@/types";
import { parseTikTokShopCSV, importCSVData, CSVRowData } from "@/lib/csvParser";
import { formatCurrency } from "@/lib/utils";

interface CSVImportProps {
  products: Product[];
  onImport: (products: Product[], transactions: any[]) => void;
}

export default function CSVImport({ products, onImport }: CSVImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CSVRowData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState<{
    newProducts: number;
    newTransactions: number;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      setErrors(["File harus berformat .csv"]);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setPreviewData([]);
    setImportStats(null);

    // Read and parse CSV
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = parseTikTokShopCSV(text);

      if (result.success) {
        setPreviewData(result.data);
        if (result.errors.length > 0) {
          setErrors(result.errors);
        }
      } else {
        setErrors(result.errors);
      }
    };

    reader.onerror = () => {
      setErrors(["Gagal membaca file"]);
    };

    reader.readAsText(selectedFile);
  };

  const handleImport = () => {
    if (previewData.length === 0) return;

    setImporting(true);

    try {
      const result = importCSVData(previewData, products);
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

  const totalProfit = previewData.reduce(
    (sum, row) => sum + (row.sellPrice - row.buyPrice) * row.quantity,
    0
  );

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Import Data TikTok Shop
        </h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="csv-file"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Upload File CSV
            </label>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-2">
              Format: CSV export dari TikTok Shop Seller Center
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              📋 Cara Import Data:
            </h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Login ke TikTok Shop Seller Center</li>
              <li>Buka menu Orders → All Orders</li>
              <li>Klik tombol Export</li>
              <li>Download file CSV</li>
              <li>Upload file CSV di sini</li>
            </ol>
          </div>
        </div>
      </div>

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
        </div>
      )}

      {/* Preview */}
      {previewData.length > 0 && !importStats && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Preview Data ({previewData.length} transaksi)
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Total Estimasi Keuntungan: {formatCurrency(totalProfit)}
              </p>
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

          {/* Preview Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Tanggal
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Produk
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">
                    Qty
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">
                    Harga Modal
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">
                    Harga Jual
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">
                    Keuntungan
                  </th>
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 10).map((row, index) => {
                  const profit = (row.sellPrice - row.buyPrice) * row.quantity;
                  return (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-2 px-3 text-gray-600">{row.date}</td>
                      <td className="py-2 px-3">
                        <p className="font-medium text-gray-900">
                          {row.productName}
                        </p>
                      </td>
                      <td className="py-2 px-3 text-right text-gray-900">
                        {row.quantity}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {formatCurrency(row.buyPrice)}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-900">
                        {formatCurrency(row.sellPrice)}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-green-600">
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


