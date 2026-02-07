import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/utils/supabase";
import { api, isOnline } from "@/utils/api";

export type Role = "cashier" | "manager" | "admin";
export type BranchId = "eden-drop-tamasha" | "eden-drop-reem" | "eden-drop-ukunda";

export type ProductId = string;
export type UserId = string;

export interface Product {
  id: ProductId;
  name: string;
  code: string;
  category: "beef" | "goat" | "offal" | "processed";
  pricePerKg: number;
  stockKg: number;
  lowStockThresholdKg: number;
  isActive: boolean;
}

export interface User {
  id: UserId;
  name: string;
  role: Role;
  branch_id?: BranchId;
}

export type PaymentMethod = "cash" | "mpesa";

export interface CartItem {
  id: string;
  productId: ProductId;
  productName: string;
  pricePerKg: number;
  weightKg: number;
}

export interface Discount {
  type: "amount" | "percent";
  value: number;
  approvedByManagerId?: UserId;
}

export interface Transaction {
  id: string;
  cashierId: UserId;
  createdAt: string;
  items: CartItem[];
  discount?: Discount;
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
}

export interface BusinessSettings {
  currency: string;
  receiptHeader: string;
  taxEnabled: boolean;
  taxRatePercent: number;
  theme: "light" | "dark";
}

export interface AuditLogEntry {
  id: string;
  actorId: UserId | "system";
  actorName: string;
  role: Role | "system";
  action: string;
  createdAt: string;
}

export interface Shift {
  id: string;
  cashierId: UserId;
  openedAt: string;
  closedAt?: string;
  status: "OPEN" | "PENDING_REVIEW" | "APPROVED";
  cashierName?: string;
  closingCash?: number;
  closingMpesa?: number;
}

export interface StockAddition {
  id: string;
  shiftId: string;
  itemId: ProductId;
  productName?: string;
  quantityKg: number;
  supplier?: string;
  notes?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdBy: UserId;
  createdAt: string;
}

export interface ShiftSnapshot {
  itemId: ProductId;
  productName: string;
  openingKg: number;
  expectedClosingKg?: number;
  actualClosingKg?: number;
  varianceKg?: number;
}

export interface AppState {
  currentUser?: User;
  token?: string;
  currentBranch: BranchId;
  products: Product[];
  users: User[];
  transactions: Transaction[];
  auditLog: AuditLogEntry[];
  settings: BusinessSettings;

  // cashier session state
  cashierCart: CartItem[];
  cashierDiscount?: Discount;
  cashierPaymentMethod: PaymentMethod;

  // SSR state
  activeShift?: Shift;
  recentShifts: Shift[];
  pendingAdditions: StockAddition[];

  // actions
  login: (userId: string, password: string) => Promise<void>;
  logout: () => void;
  setBranch: (branchId: BranchId) => void;

  addProductToCart: (product: Product, weightKg: number) => void;
  updateCartItemWeight: (cartItemId: string, weightKg: number) => void;
  removeCartItem: (cartItemId: string) => void;
  clearCart: () => void;
  setDiscount: (discount?: Discount) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  completeSale: () => Transaction | undefined;

  addProduct: (product: Product, actorId: UserId) => void;
  updateProduct: (productId: string, updates: Partial<Product>, actorId: UserId) => void;
  deleteProduct: (productId: string, actorId: UserId) => void;

  updateProductPrice: (productId: string, pricePerKg: number, managerId: UserId) => void;
  updateProductStock: (productId: string, stockKg: number, actorId: UserId) => void;

  addUser: (user: User, actorId: UserId, password?: string) => void;
  updateUserRole: (userId: UserId, role: Role, actorId: UserId) => void;
  deleteUser: (userId: UserId, actorId: UserId) => void;

  updateSettings: (settings: Partial<BusinessSettings>, actorId: UserId | "system") => void;

  // SSR actions
  openShift: (cashierId: UserId, branchId: BranchId) => Promise<void>;
  closeShift: (shiftId: string, actualCounts: Record<ProductId, number>, payments: { cash: number; mpesa: number }) => Promise<void>;
  addStockAddition: (addition: Omit<StockAddition, "id" | "status" | "createdBy" | "createdAt">) => Promise<void>;
  approveStockAddition: (additionId: string, status: "APPROVED" | "REJECTED") => Promise<void>;
  fetchShifts: (filters?: { status?: string; cashier_id?: string }) => Promise<void>;
  fetchPendingAdditions: () => Promise<void>;

  // sync actions
  initialize: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
}

const initialProducts: Product[] = [
  {
    id: "beef-regular",
    name: "Beef - Prime Cuts",
    code: "BF-PRIME",
    category: "beef",
    pricePerKg: 780,
    stockKg: 85,
    lowStockThresholdKg: 15,
    isActive: true,
  },
  {
    id: "goat-regular",
    name: "Goat - Mixed",
    code: "GT-MIX",
    category: "goat",
    pricePerKg: 720,
    stockKg: 60,
    lowStockThresholdKg: 10,
    isActive: true,
  },

  {
    id: "liver-beef",
    name: "Beef Liver",
    code: "BF-LIVER",
    category: "offal",
    pricePerKg: 550,
    stockKg: 25,
    lowStockThresholdKg: 5,
    isActive: true,
  },
  {
    id: "minced-beef",
    name: "Minced Beef",
    code: "BF-MINCED",
    category: "processed",
    pricePerKg: 800,
    stockKg: 35,
    lowStockThresholdKg: 7,
    isActive: true,
  },

];

const initialUsers: User[] = [
  { id: "a1", name: "Owner (Admin)", role: "admin" },
  { id: "m1", name: "James (Manager)", role: "manager" },
  { id: "c1", name: "Amina (Cashier 1)", role: "cashier" },
  { id: "c2", name: "Peter (Cashier 2)", role: "cashier" },
  { id: "c3", name: "Grace (Cashier 3)", role: "cashier" },
];

const initialSettings: BusinessSettings = {
  currency: "KES",
  receiptHeader: "EDEN DROP 001\nQuality • Fresh • Premium",
  taxEnabled: false,
  taxRatePercent: 8,
  theme: "dark",
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: undefined,
      token: undefined,
      currentBranch: "branch1",
      products: initialProducts,
      users: initialUsers,
      transactions: [],
      auditLog: [],
      settings: initialSettings,
      cashierCart: [],
      cashierDiscount: undefined,
      cashierPaymentMethod: "cash",
      activeShift: undefined,
      recentShifts: [],
      pendingAdditions: [],

      login: async (userId, password) => {
        try {
          const res = await api.post("/api/auth/login", { userId, password });
          if (res?.offline) {
            const offlineUser = get().users.find((u) => u.id === userId);
            if (offlineUser) {
              set({ currentUser: offlineUser, token: undefined });
              return;
            }
          }
          if (res.token && res.user) {
            localStorage.setItem("token", res.token);
            set({
              currentUser: res.user,
              token: res.token
            });
            // Re-initialize data since we now have a token
            const { initialize } = get();
            await initialize();
          }
        } catch (error) {
          if (!isOnline()) {
            const offlineUser = get().users.find((u) => u.id === userId);
            if (offlineUser) {
              set({ currentUser: offlineUser, token: undefined });
              return;
            }
          }
          console.error("Login failed:", error);
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem("token");
        set({
          currentUser: undefined,
          token: undefined,
          cashierCart: [],
          cashierDiscount: undefined,
          activeShift: undefined
        });
      },

      setBranch: (branchId: BranchId) => {
        set({ currentBranch: branchId });
      },

      addProductToCart: (product, weightKg) => {
        if (weightKg <= 0) return;
        const id = generateId();
        const item: CartItem = {
          id,
          productId: product.id,
          productName: product.name,
          pricePerKg: product.pricePerKg,
          weightKg,
        };
        set((state) => ({ cashierCart: [...state.cashierCart, item] }));
      },

      updateCartItemWeight: (cartItemId, weightKg) => {
        set((state) => ({
          cashierCart: state.cashierCart.map((item) =>
            item.id === cartItemId ? { ...item, weightKg: Math.max(weightKg, 0) } : item
          ),
        }));
      },

      removeCartItem: (cartItemId) => {
        set((state) => ({
          cashierCart: state.cashierCart.filter((item) => item.id !== cartItemId),
        }));
      },

      clearCart: () => {
        set({ cashierCart: [], cashierDiscount: undefined, cashierPaymentMethod: "cash" });
      },

      setDiscount: (discount) => {
        set({ cashierDiscount: discount });
      },

      setPaymentMethod: (method) => {
        set({ cashierPaymentMethod: method });
      },

      completeSale: () => {
        const { cashierCart, cashierDiscount, cashierPaymentMethod, currentUser, products } = get();
        if (!currentUser || currentUser.role !== "cashier" || cashierCart.length === 0) {
          return;
        }

        const subtotal = cashierCart.reduce(
          (sum, item) => sum + item.pricePerKg * item.weightKg,
          0
        );
        let total = subtotal;
        if (cashierDiscount) {
          if (cashierDiscount.type === "amount") {
            total = Math.max(subtotal - cashierDiscount.value, 0);
          } else {
            total = subtotal * (1 - cashierDiscount.value / 100);
          }
        }

        const tx: Transaction = {
          id: generateId(),
          cashierId: currentUser.id,
          createdAt: new Date().toISOString(),
          items: cashierCart,
          discount: cashierDiscount,
          subtotal,
          total,
          paymentMethod: cashierPaymentMethod,
        };

        // Sync with API
        api.post("/api/transactions", {
          id: tx.id,
          cashier_id: tx.cashierId,
          shift_id: get().activeShift?.id, // Link to active shift if exists
          branch_id: get().currentBranch,
          created_at: tx.createdAt,
          items: tx.items,
          discount: tx.discount,
          subtotal: tx.subtotal,
          total: tx.total,
          payment_method: tx.paymentMethod,
        }).then(() => {
          // fetchProducts to get updated stock handled by ledger
          get().fetchProducts();
        }).catch(err => console.error("Error completing sale:", err));

        // update local stock and tx list for immediate feedback
        const updatedProducts = products.map((p) => {
          const soldKg = cashierCart
            .filter((i) => i.productId === p.id)
            .reduce((sum, i) => sum + i.weightKg, 0);
          if (!soldKg) return p;
          return { ...p, stockKg: Math.max(p.stockKg - soldKg, 0) };
        });

        set((state) => ({
          products: updatedProducts,
          transactions: [...state.transactions, tx],
          cashierCart: [],
          cashierDiscount: undefined,
          cashierPaymentMethod: "cash",
          auditLog: [
            ...state.auditLog,
            {
              id: generateId(),
              actorId: currentUser.id,
              actorName: currentUser.name,
              role: currentUser.role,
              action: `Completed sale ${tx.id} (items: ${cashierCart.length})`,
              createdAt: new Date().toISOString(),
            },
          ],
        }));

        return tx;
      },

      addProduct: async (product, actorId) => {
        try {
          await api.post("/api/products", {
            id: product.id,
            name: product.name,
            code: product.code,
            category: product.category,
            unit_price: product.pricePerKg,
            weight_kg: product.stockKg,
            low_stock_threshold_kg: product.lowStockThresholdKg,
            status: product.isActive ? 'active' : 'inactive',
          });
          const { fetchProducts } = get();
          await fetchProducts();
        } catch (error) {
          console.error("Error adding product:", error);
        }
      },

      updateProduct: async (productId, updates, actorId) => {
        try {
          // Flatten updates for API (camelCase to snake_case if necessary)
          const apiUpdates: any = {};
          if (updates.name !== undefined) apiUpdates.name = updates.name;
          if (updates.code !== undefined) apiUpdates.code = updates.code;
          if (updates.category !== undefined) apiUpdates.category = updates.category;
          if (updates.pricePerKg !== undefined) apiUpdates.unit_price = updates.pricePerKg;
          if (updates.stockKg !== undefined) apiUpdates.weight_kg = updates.stockKg;
          if (updates.lowStockThresholdKg !== undefined) apiUpdates.low_stock_threshold_kg = updates.lowStockThresholdKg;
          if (updates.isActive !== undefined) apiUpdates.status = updates.isActive ? 'active' : 'inactive';

          console.log(`[STORE] Updating product ${productId} with:`, apiUpdates);
          await api.patch(`/api/products/${productId}`, apiUpdates);
          const { fetchProducts } = get();
          await fetchProducts();
        } catch (error) {
          console.error("Error updating product:", error);
          throw error; // Re-throw to handle in UI
        }
      },

      deleteProduct: async (productId, actorId) => {
        try {
          await api.delete(`/products/${productId}`);
          const { fetchProducts } = get();
          await fetchProducts();
        } catch (error) {
          console.error("Error deleting product:", error);
        }
      },

      updateProductPrice: async (productId, pricePerKg, managerId) => {
        const { updateProduct } = get();
        await updateProduct(productId, { pricePerKg }, managerId);
      },

      updateProductStock: async (productId, stockKg, actorId) => {
        try {
          await api.patch(`/products/${productId}`, { stock_kg: stockKg });
          const { fetchProducts } = get();
          await fetchProducts();
        } catch (error) {
          console.error("Error updating product stock:", error);
        }
      },

      addUser: async (user: User, actorId: UserId, password?: string) => {
        try {
          await api.post("/api/users", { ...user, password });
          const { fetchUsers } = get();
          await fetchUsers();
        } catch (error) {
          console.error("Error adding user:", error);
        }
      },

      updateUserRole: async (userId, role, actorId) => {
        try {
          await api.patch(`/users/${userId}`, { role });
          const { fetchUsers } = get();
          await fetchUsers();
        } catch (error) {
          console.error("Error updating user role:", error);
        }
      },

      deleteUser: async (userId, actorId) => {
        try {
          await api.delete(`/users/${userId}`);
          const { fetchUsers } = get();
          await fetchUsers();
        } catch (error) {
          console.error("Error deleting user:", error);
        }
      },

      updateSettings: (settings, actorId) => {
        set((state) => {
          const actor =
            actorId === "system"
              ? undefined
              : state.users.find((u) => u.id === actorId);
          const next = { ...state.settings, ...settings };
          return {
            settings: next,
            auditLog: [
              ...state.auditLog,
              {
                id: generateId(),
                actorId,
                actorName: actor?.name ?? "System",
                role: actor?.role ?? "system",
                action: `Updated business settings`,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        });
      },

      initialize: async () => {
        // Only fetch data if we have a token (user is logged in)
        const { token, fetchProducts, fetchUsers, fetchTransactions } = get();
        if (!token) {
          console.log("[STORE] Skipping initialize - no token yet");
          return;
        }
        await Promise.all([fetchProducts(), fetchUsers(), fetchTransactions()]);
      },

      fetchProducts: async () => {
        try {
          const { token } = get();
          if (!token) {
            console.log("[STORE] fetchProducts: Skipping - no token");
            return;
          }
          console.log("[STORE] fetchProducts: Fetching with token...");
          const data = await api.get("/api/products");
          const products = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            code: p.code,
            category: p.category,
            pricePerKg: Number(p.unit_price),
            stockKg: Number(p.weight_kg),
            lowStockThresholdKg: Number(p.low_stock_threshold_kg),
            isActive: p.status === 'active',
          }));
          console.log(`[STORE] fetchProducts: Loaded ${products.length} products`);
          set({ products });
        } catch (error) {
          console.error("[STORE] Error fetching products:", error);
        }
      },

      fetchUsers: async () => {
        try {
          const users = await api.get("/api/users");
          set({ users });
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      },

      fetchTransactions: async () => {
        try {
          const data = await api.get("/api/transactions");
          const transactions = data.map((t: any) => ({
            id: t.id,
            cashierId: t.cashier_id,
            createdAt: t.created_at,
            items: Array.isArray(t.items) ? t.items : [],
            discount: t.discount,
            subtotal: Number(t.subtotal),
            total: Number(t.total),
            paymentMethod: t.payment_method,
          }));
          set({ transactions });
        } catch (error) {
          console.error("Error fetching transactions:", error);
        }
      },

      openShift: async (cashierId, branchId) => {
        try {
          const shift = await api.post("/api/shifts/open", { cashier_id: cashierId, branch_id: branchId });
          // Set activeShift immediately for fast UI response
          set({
            activeShift: {
              id: shift.id,
              cashierId: shift.cashier_id,
              openedAt: shift.opened_at,
              status: shift.status
            }
          });
          // Fetch shifts in background (non-blocking)
          get().fetchShifts();
        } catch (error) {
          console.error("Error opening shift:", error);
          throw error;
        }
      },

      closeShift: async (shiftId, actualCounts, payments) => {
        try {
          console.log("[STORE] closeShift called with:", { shiftId, actualCounts, payments });
          const response = await api.post(`/api/shifts/${shiftId}/close`, {
            closing_stock_map: actualCounts,
            cash_received: payments.cash,
            mpesa_received: payments.mpesa
          });
          console.log("[STORE] closeShift response:", response);
          set({ activeShift: undefined });
          await get().fetchShifts();
          await get().fetchProducts();
        } catch (error) {
          console.error("Error closing shift:", error);
          throw error;
        }
      },

      addStockAddition: async (addition) => {
        try {
          await api.post("/api/stock-additions", {
            shift_id: addition.shiftId,
            item_id: addition.itemId,
            quantity_kg: addition.quantityKg,
            supplier: addition.supplier,
            notes: addition.notes
          });
          await get().fetchPendingAdditions();
        } catch (error) {
          console.error("Error adding stock:", error);
          throw error;
        }
      },

      approveStockAddition: async (additionId, status) => {
        try {
          await api.patch(`/stock-additions/${additionId}/approve`, { status });
          await get().fetchPendingAdditions();
          await get().fetchProducts();
        } catch (error) {
          console.error("Error approving stock addition:", error);
          throw error;
        }
      },

      fetchShifts: async (filters) => {
        try {
          const data = await api.get("/api/shifts", filters);
          const shifts = data.map((s: any) => ({
            id: s.id,
            cashierId: s.cashier_id,
            openedAt: s.opened_at,
            closedAt: s.closed_at,
            status: s.status,
            cashierName: s.users?.name,
            closingCash: s.closing_cash !== undefined && s.closing_cash !== null ? Number(s.closing_cash) : undefined,
            closingMpesa: s.closing_mpesa !== undefined && s.closing_mpesa !== null ? Number(s.closing_mpesa) : undefined
          }));
          set({ recentShifts: shifts });

          // If we have an OPEN shift for the current user, set it as activeShift
          const currentUser = get().currentUser;
          if (currentUser) {
            // Check for 'open' (lowercase) - backend returns lowercase
            const openShift = shifts.find((s: any) => s.cashierId === currentUser.id && (s.status === 'open' || s.status === 'OPEN'));
            if (openShift) {
              set({ activeShift: openShift });
            } else if (get().activeShift && (get().activeShift?.status !== 'open' && get().activeShift?.status !== 'OPEN')) {
              set({ activeShift: undefined });
            }
          }
        } catch (error) {
          console.error("Error fetching shifts:", error);
        }
      },

      fetchPendingAdditions: async () => {
        try {
          const data = await api.get("/api/stock-additions", { status: 'PENDING' });
          const additions = data.map((a: any) => ({
            id: a.id,
            shiftId: a.shift_id,
            itemId: a.item_id,
            productName: a.products?.name,
            quantityKg: Number(a.quantity_kg),
            supplier: a.supplier,
            notes: a.notes,
            status: a.status,
            createdBy: a.created_by,
            createdAt: a.created_at
          }));
          set({ pendingAdditions: additions });
        } catch (error) {
          console.error("Error fetching stock additions:", error);
        }
      },
    }),
    {
      name: "eden-drop-001-state",
      partialize: (state) => ({
        currentUser: state.currentUser,
        token: state.token,
        products: state.products,
        users: state.users,
        transactions: state.transactions,
        auditLog: state.auditLog,
        settings: state.settings,
        activeShift: state.activeShift,
      }),
    }
  )
);

