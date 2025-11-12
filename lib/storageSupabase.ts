import { Product, Transaction, Withdrawal } from "@/types";
import { supabase } from "./supabase";

// ====================================
// PRODUCTS - Supabase
// ====================================

export const getProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching products:", error);
      return [];
    }

    // Convert snake_case to camelCase
    return (data || []).map((p) => ({
      id: p.id,
      name: p.name,
      buyPrice: p.buy_price,
      sellPrice: p.sell_price,
      category: p.category,
      createdAt: p.created_at,
    }));
  } catch (error) {
    console.error("❌ Error in getProducts:", error);
    return [];
  }
};

export const saveProduct = async (product: Product): Promise<boolean> => {
  try {
    // Convert camelCase to snake_case for database
    const dbProduct = {
      id: product.id,
      name: product.name,
      buy_price: product.buyPrice,
      sell_price: product.sellPrice,
      category: product.category,
      created_at: product.createdAt,
    };

    const { error } = await supabase.from("products").upsert(dbProduct);

    if (error) {
      console.error("❌ Error saving product:", error);
      return false;
    }

    console.log("✅ Product saved:", product.name);
    return true;
  } catch (error) {
    console.error("❌ Error in saveProduct:", error);
    return false;
  }
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      console.error("❌ Error deleting product:", error);
      return false;
    }

    console.log("✅ Product deleted:", id);
    return true;
  } catch (error) {
    console.error("❌ Error in deleteProduct:", error);
    return false;
  }
};

export const saveProducts = async (products: Product[]): Promise<boolean> => {
  try {
    // Convert camelCase to snake_case for database
    const dbProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      buy_price: p.buyPrice,
      sell_price: p.sellPrice,
      category: p.category,
      created_at: p.createdAt,
    }));

    const { error } = await supabase.from("products").upsert(dbProducts);

    if (error) {
      console.error("❌ Error saving products:", error);
      return false;
    }

    console.log("✅ Saved", products.length, "products");
    return true;
  } catch (error) {
    console.error("❌ Error in saveProducts:", error);
    return false;
  }
};

// ====================================
// TRANSACTIONS - Supabase
// ====================================

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching transactions:", error);
      return [];
    }

    // Convert snake_case to camelCase
    return (data || []).map((t) => ({
      id: t.id,
      productId: t.product_id,
      productName: t.product_name,
      quantity: t.quantity,
      buyPrice: t.buy_price,
      sellPrice: t.sell_price,
      profit: t.profit,
      date: t.date,
      notes: t.notes,
      createdAt: t.created_at,
    }));
  } catch (error) {
    console.error("❌ Error in getTransactions:", error);
    return [];
  }
};

export const saveTransaction = async (
  transaction: Transaction
): Promise<boolean> => {
  try {
    // Convert camelCase to snake_case for database
    const dbTransaction = {
      id: transaction.id,
      product_id: transaction.productId,
      product_name: transaction.productName,
      quantity: transaction.quantity,
      buy_price: transaction.buyPrice,
      sell_price: transaction.sellPrice,
      profit: transaction.profit,
      date: transaction.date,
      notes: transaction.notes,
      created_at: transaction.createdAt,
    };

    const { error } = await supabase.from("transactions").upsert(dbTransaction);

    if (error) {
      console.error("❌ Error saving transaction:", error);
      return false;
    }

    console.log("✅ Transaction saved:", transaction.id);
    return true;
  } catch (error) {
    console.error("❌ Error in saveTransaction:", error);
    return false;
  }
};

export const deleteTransaction = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) {
      console.error("❌ Error deleting transaction:", error);
      return false;
    }

    console.log("✅ Transaction deleted:", id);
    return true;
  } catch (error) {
    console.error("❌ Error in deleteTransaction:", error);
    return false;
  }
};

export const updateTransaction = async (
  transaction: Transaction
): Promise<boolean> => {
  try {
    // Convert camelCase to snake_case for database
    const dbTransaction = {
      id: transaction.id,
      product_id: transaction.productId,
      product_name: transaction.productName,
      quantity: transaction.quantity,
      buy_price: transaction.buyPrice,
      sell_price: transaction.sellPrice,
      profit: transaction.profit,
      date: transaction.date,
      notes: transaction.notes,
      created_at: transaction.createdAt,
    };

    const { error } = await supabase
      .from("transactions")
      .update(dbTransaction)
      .eq("id", transaction.id);

    if (error) {
      console.error("❌ Error updating transaction:", error);
      return false;
    }

    console.log("✅ Transaction updated:", transaction.id);
    return true;
  } catch (error) {
    console.error("❌ Error in updateTransaction:", error);
    return false;
  }
};

export const saveTransactions = async (
  transactions: Transaction[]
): Promise<boolean> => {
  try {
    // Convert camelCase to snake_case for database
    const dbTransactions = transactions.map((t) => ({
      id: t.id,
      product_id: t.productId,
      product_name: t.productName,
      quantity: t.quantity,
      buy_price: t.buyPrice,
      sell_price: t.sellPrice,
      profit: t.profit,
      date: t.date,
      notes: t.notes,
      created_at: t.createdAt,
    }));

    const { error } = await supabase
      .from("transactions")
      .upsert(dbTransactions);

    if (error) {
      console.error("❌ Error saving transactions:", error);
      return false;
    }

    console.log("✅ Saved", transactions.length, "transactions");
    return true;
  } catch (error) {
    console.error("❌ Error in saveTransactions:", error);
    return false;
  }
};

// ====================================
// WITHDRAWALS - Supabase
// ====================================

export const getWithdrawals = async (): Promise<Withdrawal[]> => {
  try {
    const { data, error } = await supabase
      .from("withdrawals")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("❌ Error fetching withdrawals:", error);
      return [];
    }

    // Convert snake_case to camelCase
    return (data || []).map((w) => ({
      id: w.id,
      date: w.date,
      amount: w.amount,
      startPeriod: w.start_period,
      endPeriod: w.end_period,
      notes: w.notes,
      createdAt: w.created_at,
    }));
  } catch (error) {
    console.error("❌ Error in getWithdrawals:", error);
    return [];
  }
};

export const saveWithdrawal = async (
  withdrawal: Withdrawal
): Promise<boolean> => {
  try {
    const { error } = await supabase.from("withdrawals").insert({
      id: withdrawal.id,
      date: withdrawal.date,
      amount: withdrawal.amount,
      start_period: withdrawal.startPeriod,
      end_period: withdrawal.endPeriod,
      notes: withdrawal.notes,
      created_at: withdrawal.createdAt,
    });

    if (error) {
      console.error("❌ Error saving withdrawal:", error);
      return false;
    }

    console.log("✅ Saved withdrawal:", withdrawal.id);
    return true;
  } catch (error) {
    console.error("❌ Error in saveWithdrawal:", error);
    return false;
  }
};

export const deleteWithdrawal = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from("withdrawals").delete().eq("id", id);

    if (error) {
      console.error("❌ Error deleting withdrawal:", error);
      return false;
    }

    console.log("✅ Deleted withdrawal:", id);
    return true;
  } catch (error) {
    console.error("❌ Error in deleteWithdrawal:", error);
    return false;
  }
};

export const updateWithdrawal = async (
  withdrawal: Withdrawal
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("withdrawals")
      .update({
        date: withdrawal.date,
        amount: withdrawal.amount,
        start_period: withdrawal.startPeriod,
        end_period: withdrawal.endPeriod,
        notes: withdrawal.notes,
      })
      .eq("id", withdrawal.id);

    if (error) {
      console.error("❌ Error updating withdrawal:", error);
      return false;
    }

    console.log("✅ Updated withdrawal:", withdrawal.id);
    return true;
  } catch (error) {
    console.error("❌ Error in updateWithdrawal:", error);
    return false;
  }
};
