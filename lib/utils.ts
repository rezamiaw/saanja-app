import { Transaction, DashboardStats } from "@/types";

export function formatCurrency(amount: number): string {
  // Handle NaN, Infinity, or invalid numbers
  if (isNaN(amount) || !isFinite(amount)) {
    return "Rp 0";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(new Date(date));
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function isToday(date: string): boolean {
  const today = new Date();
  const checkDate = new Date(date);
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
}

export function isThisWeek(date: string): boolean {
  const today = new Date();
  const checkDate = new Date(date);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  return checkDate >= weekAgo && checkDate <= today;
}

export function isThisMonth(date: string): boolean {
  const today = new Date();
  const checkDate = new Date(date);
  return (
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
}

export function calculateDashboardStats(
  transactions: Transaction[]
): DashboardStats {
  const todayProfit = transactions
    .filter((t) => isToday(t.date))
    .reduce((sum, t) => sum + t.profit, 0);

  const weekProfit = transactions
    .filter((t) => isThisWeek(t.date))
    .reduce((sum, t) => sum + t.profit, 0);

  const monthProfit = transactions
    .filter((t) => isThisMonth(t.date))
    .reduce((sum, t) => sum + t.profit, 0);

  // Calculate top products
  const productMap = new Map<string, { profit: number; quantity: number }>();

  transactions.forEach((t) => {
    const existing = productMap.get(t.productName) || {
      profit: 0,
      quantity: 0,
    };
    productMap.set(t.productName, {
      profit: existing.profit + t.profit,
      quantity: existing.quantity + t.quantity,
    });
  });

  const topProducts = Array.from(productMap.entries())
    .map(([productName, data]) => ({
      productName,
      totalProfit: data.profit,
      totalQuantity: data.quantity,
    }))
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, 5);

  return {
    todayProfit,
    weekProfit,
    monthProfit,
    totalTransactions: transactions.length,
    topProducts,
  };
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
