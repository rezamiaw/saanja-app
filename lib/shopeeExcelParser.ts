import * as XLSX from "xlsx";
import { Transaction, Product } from "@/types";
import { generateId } from "./utils";

export interface ShopeeExcelIncomeData {
  orderId: string; // No. Pesanan
  releaseDate: string; // Tanggal Dana Dilepaskan
  totalIncome: number; // Total Penghasilan
  quantity: number; // Calculated from totalIncome / settlementPerItem
  isReturn?: boolean; // Flag for returned items (negative or zero totalIncome)
}

export interface ParsedShopeeExcelResult {
  success: boolean;
  data: ShopeeExcelIncomeData[];
  errors: string[];
  totalRows: number;
}

// Parse Shopee Income Excel file
export function parseShopeeIncomeExcel(
  file: File
): Promise<ParsedShopeeExcelResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });

        console.log("📑 Available Sheets:", workbook.SheetNames);

        // Find "Income" sheet
        let sheetName = workbook.SheetNames.find((name) =>
          name.toLowerCase().includes("income")
        );

        if (!sheetName) {
          sheetName = workbook.SheetNames[0];
          console.warn(
            "⚠️ Income sheet not found, using first sheet:",
            sheetName
          );
        } else {
          console.log("✅ Using sheet:", sheetName);
        }

        const worksheet = workbook.Sheets[sheetName];

        // Convert sheet to JSON with header row
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          defval: "",
        });

        console.log("📊 Total rows (including header):", jsonData.length);
        console.log("📋 First 10 rows for debugging:");
        jsonData.slice(0, 10).forEach((row, idx) => {
          console.log(`  Row ${idx}:`, row);
        });

        if (jsonData.length === 0) {
          resolve({
            success: false,
            data: [],
            errors: ["File Excel kosong atau tidak ada data"],
            totalRows: 0,
          });
          return;
        }

        // Find header row by looking for key column names
        // Shopee Income Excel has metadata in first few rows, actual headers are lower
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(20, jsonData.length); i++) {
          const row = jsonData[i];
          if (!Array.isArray(row)) continue;

          // Convert row to string for checking
          const rowStr = row.join("|").toLowerCase();

          // Look for characteristic Shopee Income headers
          if (
            rowStr.includes("no.") &&
            rowStr.includes("pesanan") &&
            (rowStr.includes("tanggal") || rowStr.includes("dana"))
          ) {
            headerRowIndex = i;
            console.log(`✅ Found header row at index ${i}`);
            console.log(`📋 Header row:`, row);
            break;
          }
        }

        if (headerRowIndex === -1) {
          console.error("❌ Header row not found!");
          console.error(
            "Looking for row containing: 'no.', 'pesanan', and ('tanggal' or 'dana')"
          );
          console.error("Please check the first 10 rows above.");
          resolve({
            success: false,
            data: [],
            errors: [
              "Tidak dapat menemukan header row dengan kolom yang diperlukan",
              "Parser mencari baris yang mengandung: No. Pesanan, Tanggal Dana Dilepaskan",
              "Cek Console (F12) untuk melihat 10 baris pertama dari Excel Anda",
            ],
            totalRows: 0,
          });
          return;
        }

        const headers = jsonData[headerRowIndex].map((h: any) =>
          typeof h === "string" ? h.trim() : String(h)
        );
        console.log("📌 Headers found at row", headerRowIndex, ":");
        headers.forEach((h: string, idx: number) => {
          if (h && h.trim()) {
            console.log(`   [${idx}]: "${h}"`);
          }
        });

        // Find column indices
        const colIndices = {
          orderId: -1,
          releaseDate: -1,
          totalIncome: -1,
        };

        // Flexible header matching
        headers.forEach((header: string, index: number) => {
          const lower = header.toLowerCase().trim();
          const normalized = lower.replace(/\s+/g, " "); // normalize spaces

          // No. Pesanan / Order Number
          if (
            (normalized.includes("no") && normalized.includes("pesanan")) ||
            normalized === "no. pesanan" ||
            (normalized.includes("order") && normalized.includes("number"))
          ) {
            colIndices.orderId = index;
            console.log(`✅ Found Order ID at column ${index}: "${header}"`);
          }

          // Tanggal Dana Dilepaskan / Release Date
          if (
            (normalized.includes("tanggal") &&
              normalized.includes("dilepas")) ||
            (normalized.includes("tanggal") && normalized.includes("dana")) ||
            normalized.includes("tanggal dana dilepaskan") ||
            (normalized.includes("release") && normalized.includes("date"))
          ) {
            colIndices.releaseDate = index;
            console.log(
              `✅ Found Release Date at column ${index}: "${header}"`
            );
          }

          // Total Penghasilan / Total Income / variations
          // Shopee uses different column names in different exports
          if (
            (normalized.includes("total") &&
              normalized.includes("penghasilan")) ||
            normalized === "total penghasilan" ||
            (normalized.includes("total") && normalized.includes("income")) ||
            normalized.includes("total diskon penjual") ||
            normalized.includes("penghasilan penjual")
          ) {
            colIndices.totalIncome = index;
            console.log(
              `✅ Found Total Income at column ${index}: "${header}"`
            );
          }
        });

        // Validate required columns
        const missingColumns: string[] = [];
        if (colIndices.orderId === -1) missingColumns.push("No. Pesanan");
        if (colIndices.releaseDate === -1)
          missingColumns.push("Tanggal Dana Dilepaskan");
        if (colIndices.totalIncome === -1)
          missingColumns.push("Total Penghasilan");

        if (missingColumns.length > 0) {
          resolve({
            success: false,
            data: [],
            errors: [
              `Kolom tidak ditemukan: ${missingColumns.join(", ")}`,
              `Headers yang tersedia: ${headers.join(", ")}`,
            ],
            totalRows: 0,
          });
          return;
        }

        // Parse data rows
        const parsedData: ShopeeExcelIncomeData[] = [];
        const errors: string[] = [];
        const dataRows = jsonData.slice(headerRowIndex + 1);

        console.log(`\n📊 Parsing ${dataRows.length} data rows...`);

        dataRows.forEach((row: any[], index: number) => {
          const rowNum = index + headerRowIndex + 2; // Excel row number

          // Skip empty rows
          if (
            !row ||
            row.every((cell) => !cell || String(cell).trim() === "")
          ) {
            console.log(`⏭️ Row ${rowNum}: Empty, skipping`);
            return;
          }

          try {
            const orderId = row[colIndices.orderId];
            const releaseDateRaw = row[colIndices.releaseDate];
            const totalIncomeRaw = row[colIndices.totalIncome];

            // Validate required fields
            if (!orderId || String(orderId).trim() === "") {
              console.warn(`⚠️ Row ${rowNum}: Missing Order ID, skipping`, row);
              errors.push(`Baris ${rowNum}: Order ID tidak ada`);
              return;
            }

            if (!totalIncomeRaw) {
              console.warn(
                `⚠️ Row ${rowNum}: Missing Total Income, skipping`,
                row
              );
              errors.push(`Baris ${rowNum}: Total Penghasilan tidak ada`);
              return;
            }

            // Parse Total Income (remove currency format)
            let totalIncome = 0;
            if (typeof totalIncomeRaw === "number") {
              totalIncome = totalIncomeRaw;
            } else {
              const cleanedIncome = String(totalIncomeRaw)
                .replace(/[^\d.-]/g, "")
                .trim();
              totalIncome = parseFloat(cleanedIncome);
            }

            if (isNaN(totalIncome)) {
              console.warn(
                `⚠️ Row ${rowNum}: Invalid Total Income: "${totalIncomeRaw}"`
              );
              errors.push(
                `Baris ${rowNum}: Total Penghasilan tidak valid: "${totalIncomeRaw}"`
              );
              return;
            }

            // Parse Release Date
            let releaseDate = "";
            if (releaseDateRaw) {
              releaseDate = parseDateField(releaseDateRaw);
            }

            if (!releaseDate) {
              console.warn(
                `⚠️ Row ${rowNum}: Invalid Release Date: "${releaseDateRaw}"`
              );
              // Use current date as fallback
              releaseDate = new Date().toISOString().split("T")[0];
            }

            // Check if this is a return item (negative or zero totalIncome)
            const isReturn = totalIncome <= 0;

            const dataItem: ShopeeExcelIncomeData = {
              orderId: String(orderId).trim(),
              releaseDate,
              totalIncome,
              quantity: 1, // Default, will be calculated later based on settlementPerItem
              isReturn,
            };

            parsedData.push(dataItem);
            console.log(
              `✅ Row ${rowNum}:`,
              dataItem.orderId,
              dataItem.releaseDate,
              `Rp ${dataItem.totalIncome.toLocaleString("id-ID")}`
            );
          } catch (error) {
            console.error(`❌ Row ${rowNum}: Parse error`, error);
            errors.push(`Baris ${rowNum}: Error parsing - ${error}`);
          }
        });

        console.log("\n📊 Parse Result:");
        console.log(`   - Success: ${parsedData.length > 0}`);
        console.log(`   - Total Rows: ${dataRows.length}`);
        console.log(`   - Parsed: ${parsedData.length}`);
        console.log(`   - Errors: ${errors.length}`);

        resolve({
          success: parsedData.length > 0,
          data: parsedData,
          errors,
          totalRows: dataRows.length,
        });
      } catch (error) {
        console.error("❌ Excel parsing error:", error);
        resolve({
          success: false,
          data: [],
          errors: [
            `Error parsing Excel file: ${
              error instanceof Error ? error.message : String(error)
            }`,
          ],
          totalRows: 0,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        data: [],
        errors: ["Error reading file"],
        totalRows: 0,
      });
    };

    reader.readAsBinaryString(file);
  });
}

// Helper function to parse date fields
function parseDateField(value: any): string {
  if (!value) return "";

  // If it's already a string in YYYY-MM-DD format
  if (typeof value === "string") {
    const trimmed = value.trim();

    // Try YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    // Try DD/MM/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split("/");
      return `${year}-${month}-${day}`;
    }

    // Try YYYY/MM/DD format
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(trimmed)) {
      return trimmed.replace(/\//g, "-");
    }

    // Try to parse as Date
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  }

  // If it's a number (Excel date serial)
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const year = date.y;
      const month = String(date.m).padStart(2, "0");
      const day = String(date.d).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  return "";
}

// Convert parsed data to transactions
export function convertShopeeDataToTransactions(
  data: ShopeeExcelIncomeData[],
  productCost: number,
  settlementPerItem: number
): { transactions: Transaction[]; products: Product[] } {
  const transactions: Transaction[] = [];
  const productMap = new Map<string, Product>();

  data.forEach((item) => {
    // Check if this is a return item
    const isReturn = item.isReturn || item.totalIncome <= 0;

    // Calculate quantity based on settlement per item
    let quantity = 0;
    let safeQuantity = 0;

    if (isReturn) {
      // For return items, set quantity to 0
      quantity = 0;
      safeQuantity = 0;
    } else {
      quantity =
        settlementPerItem > 0
          ? Math.round(item.totalIncome / settlementPerItem)
          : 1;
      // Ensure quantity is at least 1 to avoid division by zero
      safeQuantity = quantity > 0 ? quantity : 1;
    }

    // Calculate profit: Total Income - (Product Cost × Quantity)
    const totalCost = isReturn ? 0 : productCost * safeQuantity;
    const profit = isReturn ? 0 : item.totalIncome - totalCost;

    // Calculate sellPrice safely
    const sellPrice =
      !isReturn && safeQuantity > 0
        ? item.totalIncome / safeQuantity
        : item.totalIncome;

    // Create/update product
    const productId = generateId();
    const productName = `Shopee - ${item.orderId}`;

    if (!productMap.has(productName)) {
      productMap.set(productName, {
        id: productId,
        name: productName,
        buyPrice: productCost,
        sellPrice: sellPrice,
        createdAt: new Date().toISOString(),
      });
    }

    // Create transaction with return flag
    const notes = isReturn
      ? `🔄 RETURN | Shopee Order: ${
          item.orderId
        }\nTotal: Rp ${item.totalIncome.toLocaleString(
          "id-ID"
        )}\n⚠️ Return/Refund - Tidak ada profit/loss`
      : `Shopee Order: ${
          item.orderId
        }\nTotal: Rp ${item.totalIncome.toLocaleString(
          "id-ID"
        )}\nQty: ${safeQuantity}`;

    transactions.push({
      id: generateId(),
      productId,
      productName,
      quantity: safeQuantity,
      buyPrice: productCost,
      sellPrice: sellPrice,
      date: item.releaseDate,
      profit,
      notes,
      createdAt: new Date().toISOString(),
    });
  });

  return {
    transactions,
    products: Array.from(productMap.values()),
  };
}
