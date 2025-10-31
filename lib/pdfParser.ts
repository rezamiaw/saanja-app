import * as pdfjsLib from "pdfjs-dist";
import { Transaction, Product } from "@/types";
import { generateId } from "./utils";

// Set worker path - use local copy or CDN
if (typeof window !== "undefined") {
  // Try multiple worker sources
  try {
    // First try: local worker file
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
    console.log("✅ Worker source set to: /pdf.worker.min.js");
  } catch (e) {
    console.warn("⚠️ Failed to set worker source:", e);
  }

  // Alternative: use unpkg CDN
  // pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  console.log("📦 PDF.js version:", pdfjsLib.version);
  console.log("🔧 Worker source:", pdfjsLib.GlobalWorkerOptions.workerSrc);
}

export interface PDFIncomeData {
  orderId: string;
  productName: string;
  settlementAmount: number;
  quantity: number;
  date: string;
  orderSettledTime?: string;
}

export interface ParsedPDFResult {
  success: boolean;
  data: PDFIncomeData[];
  errors: string[];
  totalRows: number;
}

// Parse TikTok Shop Weekly Report PDF
export async function parseTikTokPDF(file: File): Promise<ParsedPDFResult> {
  // Ensure we're running in browser
  if (typeof window === "undefined") {
    console.error("❌ PDF parsing must run in browser");
    return {
      success: false,
      data: [],
      errors: ["PDF parsing hanya bisa dilakukan di browser"],
      totalRows: 0,
    };
  }

  console.log("🔍 Starting PDF parse...");
  console.log("📄 File name:", file.name);
  console.log("📄 File size:", file.size);

  try {
    console.log("📖 Reading file as ArrayBuffer...");
    const arrayBuffer = await file.arrayBuffer();
    console.log("✅ ArrayBuffer size:", arrayBuffer.byteLength);

    console.log("📖 Loading PDF document...");
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    console.log("✅ PDF loaded successfully!");
    console.log("📄 Total pages:", pdf.numPages);

    let fullText = "";
    let allTextItems: any[] = [];

    // Extract text from all pages with more detail
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`📖 Reading page ${i}/${pdf.numPages}...`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      console.log(`  ✅ Page ${i} has ${textContent.items.length} text items`);

      // Preserve text items for debugging
      allTextItems.push(...textContent.items);

      // Join with space
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";

      // Also try joining with newlines for better structure
      const pageTextLines = textContent.items
        .map((item: any) => item.str)
        .join("\n");

      console.log(`  📝 Page ${i} text length:`, pageText.length);
    }

    console.log("=".repeat(80));
    console.log("📝 FULL EXTRACTED TEXT LENGTH:", fullText.length);
    console.log("📝 SAMPLE (first 2000 chars):");
    console.log(fullText.substring(0, 2000));
    console.log("=".repeat(80));

    // Parse the extracted text
    const parsedData: PDFIncomeData[] = [];
    const errors: string[] = [];

    // Split by lines
    const lines = fullText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    console.log("📋 Total lines:", lines.length);
    console.log("📋 First 20 lines:", lines.slice(0, 20));

    // Detect Shopee
    const isShopee = fullText.includes("Shopee") || fullText.includes("shopee");

    console.log("🏪 Platform detected: Shopee =", isShopee);

    if (!isShopee) {
      console.warn("⚠️ This doesn't look like a Shopee PDF");
      console.log(
        "💡 Tip: PDF Import hanya untuk Shopee. Gunakan Excel Import untuk TikTok Shop."
      );
    }

    // Find header indices - looking for "Tanggal Dana Dilepaskan" and "Subtotal Pesanan"
    let dateColumnFound = false;
    let subtotalColumnFound = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (
        line.includes("Tanggal Dana Dilepaskan") ||
        line.includes("Tanggal dana dilepaskan")
      ) {
        dateColumnFound = true;
        console.log("✅ Found 'Tanggal Dana Dilepaskan' at line", i);
      }
      if (
        line.includes("Subtotal Pesanan") ||
        line.includes("Subtotal pesanan")
      ) {
        subtotalColumnFound = true;
        console.log("✅ Found 'Subtotal Pesanan' at line", i);
      }
    }

    if (!dateColumnFound || !subtotalColumnFound) {
      console.warn("⚠️ Required columns not found in PDF");
      console.log("Date column found:", dateColumnFound);
      console.log("Subtotal column found:", subtotalColumnFound);
    }

    // Parse based on platform
    if (isShopee) {
      console.log("📊 Parsing Shopee format (daily summary)...");

      // For Shopee: Parse date + amount pairs (no Order ID)
      // Pattern: 2025/10/20   196,250
      const shopeeDailyPattern =
        /(\d{4}\/\d{2}\/\d{2})\s+(\d{1,3}(?:,\d{3})*)/g;

      let match;
      while ((match = shopeeDailyPattern.exec(fullText)) !== null) {
        const date = match[1].replace(/\//g, "-");
        const amountStr = match[2].replace(/,/g, "");
        const amount = parseFloat(amountStr);

        // Skip if amount is 0 or too small or too large (avoid parsing totals)
        if (amount > 0 && amount < 10000000) {
          // Check if not already added
          const exists = parsedData.some(
            (d) => d.date === date && d.settlementAmount === amount
          );

          if (!exists) {
            parsedData.push({
              orderId: `SHOPEE-${date}`,
              productName: `Shopee Daily - ${date}`,
              settlementAmount: amount,
              quantity: 1,
              date: date,
            });

            console.log(
              `✅ Shopee Daily: ${date} | Rp ${amount.toLocaleString("id-ID")}`
            );
          }
        }
      }
    }

    // If not Shopee, show warning
    if (!isShopee && parsedData.length === 0) {
      errors.push("⚠️ PDF ini bukan dari Shopee Weekly Report");
      errors.push("💡 PDF Import hanya untuk Shopee");
      errors.push("🎵 Untuk TikTok Shop, gunakan menu Import Excel");
    }

    console.log("📊 Total records parsed:", parsedData.length);

    return {
      success: parsedData.length > 0,
      data: parsedData,
      errors:
        parsedData.length === 0
          ? ["Tidak dapat menemukan data settlement dalam PDF"]
          : errors,
      totalRows: parsedData.length,
    };
  } catch (error) {
    console.error("❌ ERROR PARSING PDF:");
    console.error("Error type:", typeof error);
    console.error("Error object:", error);

    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    const errorMessage =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error);

    return {
      success: false,
      data: [],
      errors: [
        "Gagal membaca PDF: " + errorMessage,
        "Buka Console (F12) untuk detail lengkap error.",
        "Pastikan file adalah PDF yang valid dari TikTok Shop.",
      ],
      totalRows: 0,
    };
  }
}

// Import PDF data
export function importPDFData(
  pdfData: PDFIncomeData[],
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

  // Process each PDF row
  pdfData.forEach((row) => {
    const productKey = row.productName.toLowerCase();
    let product = productMap.get(productKey);

    const sellPrice = row.settlementAmount / row.quantity;

    if (!product) {
      product = {
        id: generateId(),
        name: row.productName,
        buyPrice: defaultCost,
        sellPrice: sellPrice,
        category: "TikTok Shop PDF",
        createdAt: new Date().toISOString(),
      };
      productMap.set(productKey, product);
    }

    const profit = row.settlementAmount - product.buyPrice * row.quantity;
    totalProfit += profit;

    const transaction: Transaction = {
      id: generateId(),
      productId: product.id,
      productName: product.name,
      quantity: row.quantity,
      buyPrice: product.buyPrice,
      sellPrice: sellPrice,
      profit: profit,
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
      totalProfit,
    },
  };
}
