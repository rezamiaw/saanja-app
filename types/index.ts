export interface Product {
  id: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  category?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface DashboardStats {
  todayProfit: number;
  weekProfit: number;
  monthProfit: number;
  totalTransactions: number;
  topProducts: Array<{
    productName: string;
    totalProfit: number;
    totalQuantity: number;
  }>;
}


