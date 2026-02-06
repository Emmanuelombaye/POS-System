import React, { ReactNode } from "react";

export interface CashierButtonProps {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "danger" | "success";
  loading?: boolean;
  fullWidth?: boolean;
}

/**
 * Mobile-First Cashier Button
 * 
 * Features:
 * - Minimum 44x44px touch target
 * - Large, easy-to-tap buttons
 * - Big, readable text
 * - One-hand navigation friendly
 * - Fast visual feedback
 * - Accessible for gloved hands (butchery cashiers)
 */
export const CashierButton: React.FC<CashierButtonProps> = ({
  label,
  icon,
  onClick,
  disabled = false,
  size = "md",
  variant = "primary",
  loading = false,
  fullWidth = false,
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "min-h-[40px] min-w-[40px] px-3 py-2 text-sm";
      case "lg":
        return "min-h-[56px] min-w-[56px] px-6 py-4 text-lg";
      case "md":
      default:
        return "min-h-[48px] min-w-[48px] px-4 py-3 text-base";
    }
  };

  const getVariantStyles = () => {
    const base =
      "font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

    switch (variant) {
      case "primary":
        return `${base} bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800`;
      case "secondary":
        return `${base} bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400`;
      case "danger":
        return `${base} bg-red-600 text-white hover:bg-red-700 active:bg-red-800`;
      case "success":
        return `${base} bg-green-600 text-white hover:bg-green-700 active:bg-green-800`;
      default:
        return base;
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${getSizeStyles()}
        ${getVariantStyles()}
        ${fullWidth ? "w-full" : ""}
        flex items-center justify-center gap-2
        touch-none
        user-select-none
        font-family-system
      `}
      style={{
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitAppearance: "none",
      }}
    >
      {loading ? (
        <span className="inline-block animate-spin">⟳</span>
      ) : (
        icon && <span className="text-lg">{icon}</span>
      )}
      <span className="font-bold">{label}</span>
    </button>
  );
};

/**
 * Mobile-Optimized Quick Action Buttons
 * Perfect for one-hand navigation on phones
 */
export const QuickActionButtons: React.FC<{
  actions: Array<{
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    variant?: "primary" | "secondary" | "danger" | "success";
  }>;
}> = ({ actions }) => {
  return (
    <div className="flex gap-2 flex-wrap sticky bottom-0 bg-white p-4 border-t border-gray-200 safe-area-bottom">
      {actions.map((action, idx) => (
        <CashierButton
          key={idx}
          label={action.label}
          icon={action.icon}
          onClick={action.onClick}
          variant={action.variant || "secondary"}
          size="md"
          fullWidth={actions.length <= 2}
        />
      ))}
    </div>
  );
};

/**
 * Mobile Numeric Keypad Component
 * For entering quantities and prices without typing
 */
export const MobileNumericKeypad: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onConfirm?: () => void;
}> = ({ value, onChange, onConfirm }) => {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", ".", "C"];

  const handleKeyPress = (key: string) => {
    if (key === "C") {
      onChange("");
    } else if (key === ".") {
      if (!value.includes(".")) {
        onChange(value + key);
      }
    } else {
      onChange(value + key);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-300">
      {/* Display */}
      <div className="bg-gray-900 text-white text-right p-4 rounded mb-4 text-2xl font-mono font-bold min-h-[48px] flex items-center justify-end">
        {value || "0"}
      </div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => handleKeyPress(key)}
            className={`
              min-h-[48px] rounded-lg font-bold text-lg transition-all active:scale-95
              ${
                key === "C"
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }
            `}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Confirm Button */}
      {onConfirm && (
        <CashierButton
          label="Confirm"
          onClick={onConfirm}
          variant="success"
          size="md"
          fullWidth
        />
      )}
    </div>
  );
};

/**
 * Mobile Product Selector Grid
 * Big, easy-to-tap product buttons
 */
export const MobileProductGrid: React.FC<{
  products: Array<{ id: string; name: string; price: number; emoji?: string }>;
  onSelect: (productId: string) => void;
}> = ({ products, onSelect }) => {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onSelect(product.id)}
          className="
            p-4 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 
            text-white min-h-[100px]
            flex flex-col items-center justify-center
            gap-2
            transition-all active:scale-95
            hover:shadow-lg
            touch-none
          "
        >
          {product.emoji && <span className="text-4xl">{product.emoji}</span>}
          <div className="font-bold text-center">{product.name}</div>
          <div className="text-sm opacity-90">R {product.price.toFixed(2)}</div>
        </button>
      ))}
    </div>
  );
};

/**
 * Mobile Transaction Summary Card
 * Clear, large text for quick verification
 */
export const MobileTransactionSummary: React.FC<{
  items: number;
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
}> = ({ items, subtotal, discount, tax, total }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-300 p-4 mb-4">
      {/* Summary Header */}
      <div className="border-b border-gray-200 pb-3 mb-3">
        <div className="text-2xl font-bold">Transaction Summary</div>
        <div className="text-lg text-gray-600 mt-1">{items} items</div>
      </div>

      {/* Line Items */}
      <div className="space-y-2 mb-3 text-lg">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span className="font-mono">R {subtotal.toFixed(2)}</span>
        </div>

        {discount && discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Discount:</span>
            <span className="font-mono">-R {discount.toFixed(2)}</span>
          </div>
        )}

        {tax && tax > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Tax:</span>
            <span className="font-mono">R {tax.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="border-t border-gray-300 pt-3 flex justify-between items-center bg-blue-50 p-3 rounded">
        <span className="text-2xl font-bold">TOTAL</span>
        <span className="text-3xl font-bold text-blue-600 font-mono">
          R {total.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

/**
 * Mobile Payment Method Selector
 */
export const MobilePaymentMethodSelector: React.FC<{
  selectedMethod?: string;
  onSelect: (method: string) => void;
}> = ({ selectedMethod, onSelect }) => {
  const methods = [
    { id: "cash", label: "💵 Cash", emoji: "💵" },
    { id: "card", label: "💳 Card", emoji: "💳" },
    { id: "transfer", label: "📱 Transfer", emoji: "📱" },
    { id: "eft", label: "🏧 EFT", emoji: "🏧" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {methods.map((method) => (
        <button
          key={method.id}
          onClick={() => onSelect(method.id)}
          className={`
            p-4 rounded-lg transition-all active:scale-95 min-h-[80px]
            flex flex-col items-center justify-center
            font-semibold text-lg
            ${
              selectedMethod === method.id
                ? "bg-green-500 text-white border-4 border-green-600"
                : "bg-gray-200 text-gray-900 border-2 border-gray-300"
            }
          `}
        >
          <span className="text-3xl mb-2">{method.emoji}</span>
          {method.label.split(" ")[1]}
        </button>
      ))}
    </div>
  );
};
