import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, AlertTriangle, Package, Clock, DollarSign } from "lucide-react";

interface KPICardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: "blue" | "green" | "red" | "amber" | "purple";
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  size?: "small" | "medium" | "large";
}

const colorClasses = {
  blue: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
  green: "bg-gradient-to-br from-green-50 to-green-100 border-green-200",
  red: "bg-gradient-to-br from-red-50 to-red-100 border-red-200",
  amber: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200",
  purple: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200",
};

const iconColors = {
  blue: "text-blue-600",
  green: "text-green-600",
  red: "text-red-600",
  amber: "text-amber-600",
  purple: "text-purple-600",
};

const textColors = {
  blue: "text-blue-900",
  green: "text-green-900",
  red: "text-red-900",
  amber: "text-amber-900",
  purple: "text-purple-900",
};

export const KPICard = ({
  title,
  value,
  icon,
  color,
  subtitle,
  trend,
  size = "medium",
}: KPICardProps) => {
  const sizeClasses = {
    small: "p-4",
    medium: "p-6",
    large: "p-8",
  };

  const valueTextSize = {
    small: "text-2xl",
    medium: "text-3xl",
    large: "text-4xl",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${colorClasses[color]} border-2 rounded-xl ${sizeClasses[size]} shadow-sm hover:shadow-md transition-all`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className={`text-sm font-bold ${textColors[color]} opacity-70 mb-1`}>
            {title}
          </p>
          <p className={`${valueTextSize[size]} font-black ${textColors[color]}`}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className={`text-xs ${textColors[color]} opacity-60 mt-1`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`${iconColors[color]} opacity-80`}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="flex items-center gap-1 mt-4">
          {trend.isPositive ? (
            <TrendingUp className={`h-4 w-4 ${iconColors[color]}`} />
          ) : (
            <TrendingDown className={`h-4 w-4 ${iconColors[color]}`} />
          )}
          <span className={`text-sm font-bold ${textColors[color]}`}>
            {trend.isPositive ? "+" : "-"}
            {Math.abs(trend.value)}%
          </span>
        </div>
      )}
    </motion.div>
  );
};

export const KPILoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl p-6 h-32"
      />
    ))}
  </div>
);
