"use client";

import { useState } from "react";
import { Product } from "@/types";
import { generateId } from "@/lib/utils";

interface ProductFormProps {
  onSave: (product: Product) => void;
  editProduct?: Product | null;
  onCancel?: () => void;
}

export default function ProductForm({
  onSave,
  editProduct,
  onCancel,
}: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: editProduct?.name || "",
    buyPrice: editProduct?.buyPrice.toString() || "",
    sellPrice: editProduct?.sellPrice.toString() || "",
    category: editProduct?.category || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const product: Product = {
      id: editProduct?.id || generateId(),
      name: formData.name,
      buyPrice: parseFloat(formData.buyPrice),
      sellPrice: parseFloat(formData.sellPrice),
      category: formData.category || undefined,
      createdAt: editProduct?.createdAt || new Date().toISOString(),
    };

    onSave(product);

    if (!editProduct) {
      setFormData({ name: "", buyPrice: "", sellPrice: "", category: "" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nama Produk *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Contoh: Kopi Susu"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Harga Modal *
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={formData.buyPrice}
            onChange={(e) =>
              setFormData({ ...formData, buyPrice: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Harga Jual *
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={formData.sellPrice}
            onChange={(e) =>
              setFormData({ ...formData, sellPrice: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kategori (opsional)
        </label>
        <input
          type="text"
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Contoh: Minuman"
        />
      </div>

      {formData.buyPrice && formData.sellPrice && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-gray-600">
            Keuntungan per unit:{" "}
            <span className="font-bold text-green-600">
              Rp{" "}
              {(
                parseFloat(formData.sellPrice) - parseFloat(formData.buyPrice)
              ).toLocaleString("id-ID")}
            </span>
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {editProduct ? "Update Produk" : "Tambah Produk"}
        </button>
        {editProduct && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
        )}
      </div>
    </form>
  );
}


