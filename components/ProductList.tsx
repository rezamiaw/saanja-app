"use client";

import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export default function ProductList({
  products,
  onEdit,
  onDelete,
}: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500 text-lg">📦 Belum ada produk</p>
        <p className="text-gray-400 text-sm mt-1">
          Tambahkan produk pertama Anda!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product) => {
        const profitPerUnit = product.sellPrice - product.buyPrice;
        const profitMargin = ((profitPerUnit / product.buyPrice) * 100).toFixed(
          1
        );

        return (
          <div
            key={product.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">
                  {product.name}
                </h3>
                {product.category && (
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded mt-1">
                    {product.category}
                  </span>
                )}
                <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Harga Modal</p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(product.buyPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Harga Jual</p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(product.sellPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Untung/Unit</p>
                    <p className="font-medium text-green-600">
                      {formatCurrency(profitPerUnit)}
                    </p>
                    <p className="text-xs text-gray-500">({profitMargin}%)</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => onEdit(product)}
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Hapus produk "${product.name}"?`)) {
                      onDelete(product.id);
                    }
                  }}
                  className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


