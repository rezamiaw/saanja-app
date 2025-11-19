import * as XLSX from "xlsx";
import { Transaction, Product } from "@/types";
import { generateId } from "./utils";

export interface ExcelIncomeData {
  orderId: string;
  productName: string; // Will be Order ID if no product name
  settlementAmount: number;
  quantity: number;
  date: string;
  orderSettledTime?: string;
  totalRevenue?: number;
  variation?: string;
  refundSubtotal?: number; // Refund subtotal after seller discounts
  isReturn?: boolean; // Flag for returned items (negative settlement or negative refundSubtotal)
}

export interface ParsedExcelResult {
  success: boolean;
  data: ExcelIncomeData[];
  errors: string[];
  totalRows: number;
}

// Parse TikTok Shop Income Excel file
export function parseTikTokIncomeExcel(file: File): Promise<ParsedExcelResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });

        console.log("📑 Available Sheets:", workbook.SheetNames);

        // Try to find "Order details" sheet, otherwise use first sheet
        let sheetName = workbook.SheetNames[0];
        const orderDetailsSheet = workbook.SheetNames.find(
          (name) =>
            name.toLowerCase().includes("order") &&
            name.toLowerCase().includes("detail")
        );

        if (orderDetailsSheet) {
          sheetName = orderDetailsSheet;
          console.log("✅ Using sheet:", sheetName);
        } else {
          console.log("⚠️ Order details sheet not found, using:", sheetName);
        }

        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Debug: Log first row to see column names
        console.log("📊 Excel Data Sample:", jsonData[0]);
        console.log("📋 Total Rows:", jsonData.length);
        console.log(
          "🔑 Available Keys:",
          jsonData[0] ? Object.keys(jsonData[0]) : []
        );

        const errors: string[] = [];
        const parsedData: ExcelIncomeData[] = [];

        // Clean up data - trim all keys (remove spaces from column names)
        const cleanedData = jsonData.map((row: any) => {
          const cleanRow: any = {};
          Object.keys(row).forEach((key) => {
            cleanRow[key.trim()] = row[key];
          });
          return cleanRow;
        });

        cleanedData.forEach((row: any, index: number) => {
          try {
            // Debug first row
            if (index === 0) {
              console.log("🔍 First Row Data:", row);
              console.log("📅 Date columns:", {
                "Order created time": row["Order created time"],
                "Order settled time": row["Order settled time"],
              });
            }

            // Map kolom dari Excel - Settlement Income format
            const orderId =
              row["Order/adjustment ID"] ||
              row["Order ID"] ||
              row["ID pesanan"] ||
              row["order_id"] ||
              row["OrderID"] ||
              "";

            // Product name - if not exist, use Order ID
            let productName =
              row["Product name"] ||
              row["Nama produk"] ||
              row["Product Name"] ||
              row["product_name"] ||
              row["ProductName"] ||
              "";

            // If no product name, use Order ID as fallback
            if (!productName && orderId) {
              productName = `Order ${orderId.substring(0, 12)}...`;
            }

            const settlementAmountStr =
              row["Total settlement amount"] ||
              row["Jumlah penyelesaian total"] ||
              row["Settlement Amount"] ||
              row["settlement_amount"] ||
              row["Total Settlement Amount"] ||
              "0";

            const totalRevenueStr =
              row["Total Revenue"] ||
              row["Total revenue"] ||
              row["total_revenue"] ||
              "0";

            // Quantity default to 1 for settlement records
            const quantityStr =
              row["Quantity"] ||
              row["Kuantitas"] ||
              row["quantity"] ||
              row["Qty"] ||
              "1";

            const dateStr =
              row["Order created time"] ||
              row["Waktu pembuatan pesanan"] ||
              row["Created Time"] ||
              row["Order Created Time"] ||
              row["created_time"] ||
              row["Date"] ||
              "";

            const settledTimeStr =
              row["Order settled time"] ||
              row["Waktu penyelesaian pesanan"] ||
              row["Settled Time"] ||
              "";

            const variation =
              row["Variation"] ||
              row["Variasi"] ||
              row["SKU name"] ||
              row["variation"] ||
              row["SKU Name"] ||
              "";

            const refundSubtotalStr =
              row["Refund subtotal after seller discounts"] ||
              row["refund_subtotal_after_seller_discounts"] ||
              row["Refund Subtotal"] ||
              row["refund_subtotal"] ||
              "";

            // Skip if no settlement amount and no order ID
            if (!settlementAmountStr || (!productName && !orderId)) {
              if (index < 3) {
                console.warn(`⚠️ Row ${index + 1}: Missing required data`, row);
              }
              return;
            }

            // Parse numbers
            const settlementAmount =
              typeof settlementAmountStr === "number"
                ? settlementAmountStr
                : parseFloat(
                    String(settlementAmountStr).replace(/[^0-9.-]/g, "")
                  ) || 0;

            const totalRevenue =
              typeof totalRevenueStr === "number"
                ? totalRevenueStr
                : parseFloat(
                    String(totalRevenueStr).replace(/[^0-9.-]/g, "")
                  ) || 0;

            const quantity =
              typeof quantityStr === "number"
                ? quantityStr
                : parseInt(String(quantityStr)) || 1;

            // Parse refund subtotal
            let refundSubtotal: number | undefined = undefined;
            if (refundSubtotalStr && String(refundSubtotalStr).trim() !== "") {
              const parsedRefund =
                typeof refundSubtotalStr === "number"
                  ? refundSubtotalStr
                  : parseFloat(
                      String(refundSubtotalStr).replace(/[^0-9.-]/g, "")
                    );
              if (!isNaN(parsedRefund)) {
                refundSubtotal = parsedRefund;
              }
            }

            // Parse date
            let parsedDate = new Date().toISOString().split("T")[0];
            if (dateStr) {
              try {
                // Handle Excel date format
                if (typeof dateStr === "number") {
                  // Excel serial date
                  const excelDate = XLSX.SSF.parse_date_code(dateStr);
                  parsedDate = `${excelDate.y}-${String(excelDate.m).padStart(
                    2,
                    "0"
                  )}-${String(excelDate.d).padStart(2, "0")}`;
                } else {
                  // String date
                  const date = new Date(dateStr);
                  if (!isNaN(date.getTime())) {
                    parsedDate = date.toISOString().split("T")[0];
                  }
                }
              } catch {
                // Keep default date
              }
            }

            // Parse settled time (prioritas utama untuk tanggal)
            let settledDate = parsedDate;
            if (settledTimeStr) {
              try {
                if (typeof settledTimeStr === "number") {
                  const excelDate = XLSX.SSF.parse_date_code(settledTimeStr);
                  settledDate = `${excelDate.y}-${String(excelDate.m).padStart(
                    2,
                    "0"
                  )}-${String(excelDate.d).padStart(2, "0")}`;
                } else {
                  // Handle string format like "2025/10/29"
                  const dateString = String(settledTimeStr).trim();

                  // Try parsing YYYY/MM/DD format
                  if (dateString.includes("/")) {
                    const parts = dateString.split("/");
                    if (parts.length === 3) {
                      const [year, month, day] = parts;
                      settledDate = `${year}-${month.padStart(
                        2,
                        "0"
                      )}-${day.padStart(2, "0")}`;
                    }
                  } else {
                    const date = new Date(dateString);
                    if (!isNaN(date.getTime())) {
                      settledDate = date.toISOString().split("T")[0];
                    }
                  }
                }
              } catch (error) {
                console.warn(
                  "Error parsing settled date:",
                  settledTimeStr,
                  error
                );
                // Keep parsedDate
              }
            }

            // Debug first few rows date parsing
            if (index < 3) {
              console.log(`📅 Row ${index + 1} Date:`, {
                raw: settledTimeStr,
                parsed: settledDate,
              });
            }

            // Check if this is a return
            // Return if: negative settlement OR refundSubtotal < 0 (minus/negative)
            const isReturn =
              settlementAmount < 0 ||
              (refundSubtotal !== undefined && refundSubtotal < 0);

            parsedData.push({
              orderId: String(orderId),
              productName: String(productName),
              settlementAmount,
              quantity,
              date: settledDate, // Use settled time as main date
              orderSettledTime: settledDate,
              totalRevenue,
              variation: variation ? String(variation) : undefined,
              refundSubtotal,
              isReturn, // Flag for returned items
            });
          } catch (error) {
            errors.push(`Baris ${index + 2}: Error parsing data`);
          }
        });

        resolve({
          success: parsedData.length > 0,
          data: parsedData,
          errors,
          totalRows: parsedData.length,
        });
      } catch (error) {
        resolve({
          success: false,
          data: [],
          errors: ["Gagal membaca file Excel. Pastikan format file benar."],
          totalRows: 0,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        data: [],
        errors: ["Gagal membaca file"],
        totalRows: 0,
      });
    };

    reader.readAsBinaryString(file);
  });
}

// Import Excel data with cost mapping
export function importExcelIncomeData(
  excelData: ExcelIncomeData[],
  existingProducts: Product[],
  defaultCost: number
): {
  products: Product[];
  transactions: Transaction[];
  stats: {
    newProducts: number;
    newTransactions: number;
    totalProfit: number;
  };
} {
  const productMap = new Map<string, Product>();
  const transactions: Transaction[] = [];
  let totalProfit = 0;

  // Add existing products to map
  existingProducts.forEach((p) => {
    productMap.set(p.name.toLowerCase(), p);
  });

  // Process each Excel row
  excelData.forEach((row) => {
    const productKey = row.productName.toLowerCase();
    let product = productMap.get(productKey);

    // Harga jual per unit = Settlement Amount / Quantity
    const sellPrice = row.settlementAmount / row.quantity;

    // Create or update product
    if (!product) {
      product = {
        id: generateId(),
        name: row.productName,
        buyPrice: defaultCost, // Use default cost
        sellPrice: sellPrice,
        category: "TikTok Shop Income",
        createdAt: new Date().toISOString(),
      };
      productMap.set(productKey, product);
    } else {
      // Update sell price with latest data
      product.sellPrice = sellPrice;
    }

    // Calculate profit - Return items have 0 profit (not counted)
    let profit = 0;
    if (row.isReturn) {
      profit = 0; // Return items: no profit/loss
    } else {
      profit = row.settlementAmount - product.buyPrice * row.quantity;
      totalProfit += profit; // Only add non-return profit to total
    }

    // Create transaction notes
    let notes = "";
    if (row.isReturn) {
      notes = `🔄 RETURN | Order ID: ${row.orderId}${
        row.variation ? ` | ${row.variation}` : ""
      }`;
      // Add refund subtotal info if available
      if (row.refundSubtotal !== undefined && row.refundSubtotal < 0) {
        notes += `\nRefund Subtotal: Rp ${row.refundSubtotal.toLocaleString(
          "id-ID"
        )}`;
      }
    } else {
      notes = row.orderId
        ? `Order ID: ${row.orderId}${
            row.variation ? ` | ${row.variation}` : ""
          }`
        : row.variation || "";
    }

    // Create transaction
    const transaction: Transaction = {
      id: generateId(),
      productId: product.id,
      productName: product.name,
      quantity: row.quantity,
      buyPrice: product.buyPrice,
      sellPrice: sellPrice,
      profit: profit,
      date: row.date,
      notes: notes || undefined,
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
      totalProfit,
    },
  };
}
