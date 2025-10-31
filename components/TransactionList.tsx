"use client";

import { Transaction } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export default function TransactionList({
  transactions,
  onDelete,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500 text-lg">📊 Belum ada transaksi</p>
        <p className="text-gray-400 text-sm mt-1">
          Catat transaksi pertama Anda!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-200 bg-gray-50">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
              Tanggal
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
              Order ID
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
              Qty
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
              Modal
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
              Omzet
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
              Keuntungan
            </th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => {
            // Check if this is a return item
            const isReturn =
              transaction.notes?.includes("RETURN") || transaction.profit === 0;

            return (
              <tr
                key={transaction.id}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  isReturn ? "bg-red-50" : ""
                }`}
              >
                <td className="py-3 px-4 text-sm text-gray-600">
                  {formatDate(transaction.date)}
                </td>
                <td className="py-3 px-4">
                  {(() => {
                    // Extract Order ID from notes if available
                    if (
                      transaction.notes &&
                      transaction.notes.includes("Order ID:")
                    ) {
                      const orderId = transaction.notes
                        .split("Order ID:")[1]
                        .split("|")[0]
                        .trim();
                      return (
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-xs text-gray-900">
                            {orderId}
                          </p>
                          {isReturn && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                              🔄 RETURN
                            </span>
                          )}
                        </div>
                      );
                    }

                    // Extract Order ID from productName if starts with "Order "
                    if (transaction.productName.startsWith("Order ")) {
                      const orderId = transaction.productName
                        .replace("Order ", "")
                        .replace("...", "");
                      return (
                        <p className="font-mono text-xs text-gray-900">
                          {orderId}
                        </p>
                      );
                    }

                    // Fallback to product name
                    return (
                      <p className="font-medium text-gray-900">
                        {transaction.productName}
                      </p>
                    );
                  })()}
                </td>
                <td className="py-3 px-4 text-right text-sm text-gray-600">
                  {isReturn ? "-" : transaction.quantity}
                </td>
                <td className="py-3 px-4 text-right text-sm text-gray-600">
                  {isReturn
                    ? "-"
                    : formatCurrency(
                        transaction.buyPrice * transaction.quantity
                      )}
                </td>
                <td className="py-3 px-4 text-right text-sm text-gray-600">
                  {isReturn
                    ? "-"
                    : formatCurrency(
                        transaction.sellPrice * transaction.quantity
                      )}
                </td>
                <td
                  className={`py-3 px-4 text-right text-sm font-semibold ${
                    isReturn ? "text-gray-500" : "text-green-600"
                  }`}
                >
                  {isReturn ? "Rp 0" : formatCurrency(transaction.profit)}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => {
                      if (confirm("Hapus transaksi ini?")) {
                        onDelete(transaction.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
