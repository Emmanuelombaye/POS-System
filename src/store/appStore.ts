import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "cashier" | "manager" | "admin";

export type ProductId = string;
export type UserId = string;

export interface Product {
  id: ProductId;
  name: string;
  code: string;
  category: "beef" | "goat" | "chicken" | "offal" | "processed";
  pricePerKg: number;
  stockKg: number;
  lowStockThresholdKg: number;
  isActive: boolean;
}

export interface User {
  id: UserId;
  name: string;
  role: Role;
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

export interface AppState {
  currentUser?: User;
  products: Product[];
  users: User[];
  transactions: Transaction[];
  auditLog: AuditLogEntry[];
  settings: BusinessSettings;

  // cashier session state
  cashierCart: CartItem[];
  cashierDiscount?: Discount;
  cashierPaymentMethod: PaymentMethod;

  // actions
  login: (userId: string) => void;
  logout: () => void;

  addProductToCart: (product: Product, weightKg: number) => void;
  updateCartItemWeight: (cartItemId: string, weightKg: number) => void;
  removeCartItem: (cartItemId: string) => void;
  clearCart: () => void;
  setDiscount: (discount?: Discount) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  completeSale: () => Transaction | undefined;

  updateProductPrice: (productId: string, pricePerKg: number, managerId: UserId) => void;
  updateProductStock: (productId: string, stockKg: number, actorId: UserId) => void;
  upsertProduct: (product: Product, actorId: UserId) => void;
  removeProduct: (productId: string, actorId: UserId) => void;

  addUser: (user: User, actorId: UserId) => void;
  updateUserRole: (userId: UserId, role: Role, actorId: UserId) => void;

  updateSettings: (settings: Partial<BusinessSettings>, actorId: UserId | "system") => void;
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
    id: "chicken-whole",
    name: "Chicken - Whole",
    code: "CH-WHOLE",
    category: "chicken",
    pricePerKg: 520,
    stockKg: 40,
    lowStockThresholdKg: 8,
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
  {
    id: "sausages-beef",
    name: "Beef Sausages",
    code: "BF-SAUS",
    category: "processed",
    pricePerKg: 900,
    stockKg: 20,
    lowStockThresholdKg: 4,
    isActive: true,
  },
];

const initialUsers: User[] = [
  { id: "c1", name: "Amina (Cashier 1)", role: "cashier" },
  { id: "c2", name: "Peter (Cashier 2)", role: "cashier" },
  { id: "c3", name: "Grace (Cashier 3)", role: "cashier" },
  { id: "m1", name: "James (Manager)", role: "manager" },
  { id: "a1", name: "Owner (Admin)", role: "admin" },
];

const initialSettings: BusinessSettings = {
  currency: "KES",
  receiptHeader: "EDEN TOP\nQuality • Fresh • Premium",
  taxEnabled: false,
  taxRatePercent: 8,
  theme: "dark",
};

const generateId = () => crypto.randomUUID();

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: undefined,
      products: initialProducts,
      users: initialUsers,
      transactions: [],
      auditLog: [],
      settings: initialSettings,
      cashierCart: [],
      cashierDiscount: undefined,
      cashierPaymentMethod: "cash",

      login: (userId) => {
        const user = get().users.find((u) => u.id === userId);
        if (!user) return;
        set({ currentUser: user });
      },

      logout: () => {
        set({ currentUser: undefined, cashierCart: [], cashierDiscount: undefined });
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

        // update stock
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

      updateProductPrice: (productId, pricePerKg, managerId) => {
        set((state) => {
          const manager = state.users.find((u) => u.id === managerId);
          return {
            products: state.products.map((p) =>
              p.id === productId ? { ...p, pricePerKg } : p
            ),
            auditLog: [
              ...state.auditLog,
              {
                id: generateId(),
                actorId: managerId,
                actorName: manager?.name ?? "Unknown",
                role: manager?.role ?? "manager",
                action: `Updated price for ${productId} to ${pricePerKg}`,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        });
      },

      updateProductStock: (productId, stockKg, actorId) => {
        set((state) => {
          const actor = state.users.find((u) => u.id === actorId);
          return {
            products: state.products.map((p) =>
              p.id === productId ? { ...p, stockKg } : p
            ),
            auditLog: [
              ...state.auditLog,
              {
                id: generateId(),
                actorId,
                actorName: actor?.name ?? "Unknown",
                role: actor?.role ?? "manager",
                action: `Adjusted stock for ${productId} to ${stockKg}kg`,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        });
      },

      upsertProduct: (product, actorId) => {
        set((state) => {
          const actor = state.users.find((u) => u.id === actorId);
          const exists = state.products.some((p) => p.id === product.id);
          const products = exists
            ? state.products.map((p) => (p.id === product.id ? product : p))
            : [...state.products, product];
          return {
            products,
            auditLog: [
              ...state.auditLog,
              {
                id: generateId(),
                actorId,
                actorName: actor?.name ?? "Unknown",
                role: actor?.role ?? "admin",
                action: `${exists ? "Updated" : "Created"} product ${product.name}`,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        });
      },

      removeProduct: (productId, actorId) => {
        set((state) => {
          const actor = state.users.find((u) => u.id === actorId);
          const product = state.products.find((p) => p.id === productId);
          return {
            products: state.products.filter((p) => p.id !== productId),
            auditLog: [
              ...state.auditLog,
              {
                id: generateId(),
                actorId,
                actorName: actor?.name ?? "Unknown",
                role: actor?.role ?? "admin",
                action: `Removed product ${product?.name ?? productId}`,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        });
      },

      addUser: (user, actorId) => {
        set((state) => {
          const actor = state.users.find((u) => u.id === actorId);
          return {
            users: [...state.users, user],
            auditLog: [
              ...state.auditLog,
              {
                id: generateId(),
                actorId,
                actorName: actor?.name ?? "Unknown",
                role: actor?.role ?? "admin",
                action: `Created user ${user.name} (${user.role})`,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        });
      },

      updateUserRole: (userId, role, actorId) => {
        set((state) => {
          const actor = state.users.find((u) => u.id === actorId);
          const user = state.users.find((u) => u.id === userId);
          return {
            users: state.users.map((u) => (u.id === userId ? { ...u, role } : u)),
            auditLog: [
              ...state.auditLog,
              {
                id: generateId(),
                actorId,
                actorName: actor?.name ?? "Unknown",
                role: actor?.role ?? "admin",
                action: `Changed role for ${user?.name ?? userId} to ${role}`,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        });
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
    }),
    {
      name: "eden-top-state",
      partialize: (state) => ({
        currentUser: state.currentUser,
        products: state.products,
        users: state.users,
        transactions: state.transactions,
        auditLog: state.auditLog,
        settings: state.settings,
      }),
    }
  )
);

