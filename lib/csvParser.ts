import { Transaction, Product } from "@/types";
import { generateId } from "./utils";

export interface CSVRowData {
  productName: string;
  variation: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  date: string;
  orderId: string;
}

export interface ParsedCSVResult {
  success: boolean;
  data: CSVRowData[];
  errors: string[];
  totalRows: number;
}

// Parse CSV TikTok Shop format
export function parseTikTokShopCSV(csvText: string): ParsedCSVResult {
  const lines = csvText.split("\n").filter((line) => line.trim());
  const errors: string[] = [];
  const data: CSVRowData[] = [];

  if (lines.length < 2) {
    return {
      success: false,
      data: [],
      errors: ["File CSV kosong atau tidak valid"],
      totalRows: 0,
    };
  }

  // Get headers
  const headers = lines[0].split(",").map((h) => h.trim());

  // Find column indices
  const colIndices = {
    orderId: headers.findIndex((h) => h.includes("Order ID")),
    productName: headers.findIndex((h) => h.includes("Product Name")),
    variation: headers.findIndex((h) => h.includes("Variation")),
    quantity: headers.findIndex((h) => h.includes("Quantity")),
    buyPrice: headers.findIndex((h) => h.includes("SKU Unit Original Price")),
    orderAmount: headers.findIndex((h) => h.includes("Order Amount")),
    createdTime: headers.findIndex((h) => h.includes("Created Time")),
  };

  // Validate required columns exist
  if (
    colIndices.productName === -1 ||
    colIndices.quantity === -1 ||
    colIndices.orderAmount === -1
  ) {
    return {
      success: false,
      data: [],
      errors: [
        "Format CSV tidak sesuai. Pastikan file dari TikTok Shop export.",
      ],
      totalRows: 0,
    };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      // Split by comma, handling quoted fields
      const values = parseCSVLine(line);

      const productName = values[colIndices.productName]?.trim() || "";
      const variation = values[colIndices.variation]?.trim() || "";
      const quantityStr = values[colIndices.quantity]?.trim() || "0";
      const orderAmountStr = values[colIndices.orderAmount]?.trim() || "0";
      const buyPriceStr = values[colIndices.buyPrice]?.trim() || "0";
      const dateStr = values[colIndices.createdTime]?.trim() || "";
      const orderId = values[colIndices.orderId]?.trim() || "";

      // Skip if product name is empty
      if (!productName) continue;

      const quantity = parseInt(quantityStr) || 0;
      const orderAmount = parseFloat(orderAmountStr) || 0;
      const buyPrice = parseFloat(buyPriceStr) || 0;

      // Parse date (format: DD/MM/YYYY HH:MM:SS)
      let parsedDate = new Date().toISOString().split("T")[0];
      if (dateStr) {
        try {
          const [datePart] = dateStr.split("\t");
          const [day, month, year] = datePart.trim().split("/");
          if (day && month && year) {
            parsedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
              2,
              "0"
            )}`;
          }
        } catch {
          // Use default date if parsing fails
        }
      }

      // Use productName only (without variation)
      data.push({
        productName: productName,
        variation,
        quantity,
        buyPrice,
        sellPrice: orderAmount / quantity, // Convert Order Amount to per-unit price
        date: parsedDate,
        orderId,
      });
    } catch (error) {
      errors.push(`Baris ${i + 1}: Error parsing data`);
    }
  }

  return {
    success: data.length > 0,
    data,
    errors,
    totalRows: data.length,
  };
}

// Helper function to parse CSV line with quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

// Convert CSV data to transactions and auto-create products
export function importCSVData(
  csvData: CSVRowData[],
  existingProducts: Product[]
): {
  products: Product[];
  transactions: Transaction[];
  stats: {
    newProducts: number;
    newTransactions: number;
  };
} {
  const productMap = new Map<string, Product>();
  const transactions: Transaction[] = [];

  // Add existing products to map
  existingProducts.forEach((p) => {
    productMap.set(p.name.toLowerCase(), p);
  });

  // Process each CSV row
  csvData.forEach((row) => {
    const productKey = row.productName.toLowerCase();
    let product = productMap.get(productKey);

    // Create product if doesn't exist
    if (!product) {
      product = {
        id: generateId(),
        name: row.productName,
        buyPrice: row.buyPrice || 0,
        sellPrice: row.sellPrice,
        category: "TikTok Shop",
        createdAt: new Date().toISOString(),
      };
      productMap.set(productKey, product);
    } else {
      // Update prices if different (use latest prices from CSV)
      if (row.buyPrice > 0) {
        product.buyPrice = row.buyPrice;
      }
      if (row.sellPrice > 0) {
        product.sellPrice = row.sellPrice;
      }
    }

    // Create transaction
    const profit = (product.sellPrice - product.buyPrice) * row.quantity;

    const transaction: Transaction = {
      id: generateId(),
      productId: product.id,
      productName: product.name,
      quantity: row.quantity,
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
      profit,
      date: row.date,
      notes: row.orderId ? `Order ID: ${row.orderId}` : undefined,
      createdAt: new Date().toISOString(),
    };

    transactions.push(transaction);
  });

  const allProducts = Array.from(productMap.values());
  const newProducts = allProducts.length - existingProducts.length;

  return {
    products: allProducts,
    transactions,
    stats: {
      newProducts,
      newTransactions: transactions.length,
    },
  };
}
