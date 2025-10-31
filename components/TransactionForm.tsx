"use client";

import { useState, useEffect } from "react";
import { Transaction, Product } from "@/types";
import { generateId } from "@/lib/utils";

interface TransactionFormProps {
  products: Product[];
  onSave: (transaction: Transaction) => void;
}

export default function TransactionForm({
  products,
  onSave,
}: TransactionFormProps) {
  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (formData.productId) {
      const product = products.find((p) => p.id === formData.productId);
      setSelectedProduct(product || null);
    } else {
      setSelectedProduct(null);
    }
  }, [formData.productId, products]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) return;

    const quantity = parseInt(formData.quantity);
    const profit =
      (selectedProduct.sellPrice - selectedProduct.buyPrice) * quantity;

    const transaction: Transaction = {
      id: generateId(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      buyPrice: selectedProduct.buyPrice,
      sellPrice: selectedProduct.sellPrice,
      profit,
      date: formData.date,
      notes: formData.notes || undefined,
      createdAt: new Date().toISOString(),
    };

    onSave(transaction);
    setFormData({
      productId: "",
      quantity: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  const totalProfit =
    selectedProduct && formData.quantity
      ? (selectedProduct.sellPrice - selectedProduct.buyPrice) *
        parseInt(formData.quantity)
      : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pilih Produk *
        </label>
        <select
          required
          value={formData.productId}
          onChange={(e) =>
            setFormData({ ...formData, productId: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- Pilih Produk --</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} (Untung: Rp{" "}
              {(product.sellPrice - product.buyPrice).toLocaleString("id-ID")}
              /unit)
            </option>
          ))}
        </select>
        {products.length === 0 && (
          <p className="text-sm text-red-600 mt-1">
            Belum ada produk. Tambahkan produk terlebih dahulu di tab Produk.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jumlah Terjual *
          </label>
          <input
            type="number"
            required
            min="1"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({ ...formData, quantity: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tanggal *
          </label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Catatan (opsional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Catatan tambahan..."
          rows={2}
        />
      </div>

      {selectedProduct && formData.quantity && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              Modal:{" "}
              <span className="font-medium">
                Rp{" "}
                {(
                  selectedProduct.buyPrice * parseInt(formData.quantity)
                ).toLocaleString("id-ID")}
              </span>
            </p>
            <p className="text-gray-600">
              Omzet:{" "}
              <span className="font-medium">
                Rp{" "}
                {(
                  selectedProduct.sellPrice * parseInt(formData.quantity)
                ).toLocaleString("id-ID")}
              </span>
            </p>
            <p className="text-gray-900 font-bold text-base border-t border-green-300 pt-1 mt-2">
              Keuntungan:{" "}
              <span className="text-green-600">
                Rp {totalProfit.toLocaleString("id-ID")}
              </span>
            </p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={products.length === 0}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Catat Transaksi
      </button>
    </form>
  );
}


