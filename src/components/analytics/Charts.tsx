import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface SalesTrendChartProps {
  data: Array<{ date: string; sales: number }>;
  loading?: boolean;
}

export const SalesTrendChart = ({ data, loading }: SalesTrendChartProps) => {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl h-80"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm"
    >
      <h3 className="text-lg font-black text-slate-900 mb-4">Sales Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "2px solid #3b82f6",
              borderRadius: "8px",
            }}
          />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: "#3b82f6", r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

interface TopProductsChartProps {
  data: Array<{
    name: string;
    kg: number;
  }>;
  loading?: boolean;
}

const productColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export const TopProductsChart = ({ data, loading }: TopProductsChartProps) => {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl h-80"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm"
    >
      <h3 className="text-lg font-black text-slate-900 mb-4">Top 5 Products</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" stroke="#64748b" />
          <YAxis dataKey="name" type="category" stroke="#64748b" width={120} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "2px solid #10b981",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="kg" radius={[0, 8, 8, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={productColors[index % productColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

interface BranchComparisonChartProps {
  data: Array<{
    branch: string;
    sales: number;
    cash: number;
    mpesa: number;
  }>;
  loading?: boolean;
}

export const BranchComparisonChart = ({ data, loading }: BranchComparisonChartProps) => {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl h-80"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm"
    >
      <h3 className="text-lg font-black text-slate-900 mb-4">Branch Comparison</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="branch" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "2px solid #f59e0b",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Bar dataKey="cash" fill="#10b981" radius={[8, 8, 0, 0]} />
          <Bar dataKey="mpesa" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

interface ProfitTrendChartProps {
  data: Array<{ date: string; profit: number }>;
  loading?: boolean;
}

export const ProfitTrendChart = ({ data, loading }: ProfitTrendChartProps) => {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl h-80"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm"
    >
      <h3 className="text-lg font-black text-slate-900 mb-4">Profit Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "2px solid #10b981",
              borderRadius: "8px",
            }}
          />
          <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#profitGradient)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

interface SalesForecastChartProps {
  data: Array<{ date: string; actual?: number; forecast?: number }>;
  loading?: boolean;
}

export const SalesForecastChart = ({ data, loading }: SalesForecastChartProps) => {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl h-80"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm"
    >
      <h3 className="text-lg font-black text-slate-900 mb-4">Smart Sales Forecast</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "2px solid #6366f1",
              borderRadius: "8px",
            }}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ r: 4, fill: "#3b82f6" }}
            name="Actual"
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#6366f1"
            strokeDasharray="6 6"
            strokeWidth={3}
            dot={{ r: 4, fill: "#6366f1" }}
            name="Forecast"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

interface AlertItem {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
}

interface AlertsPanelProps {
  items: AlertItem[];
  loading?: boolean;
}

const severityStyles = {
  critical: "bg-red-50 border-red-200 text-red-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  info: "bg-blue-50 border-blue-200 text-blue-900",
};

export const AlertsPanel = ({ items, loading }: AlertsPanelProps) => {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl h-64"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm"
    >
      <h3 className="text-lg font-black text-slate-900 mb-4">
        {items.length > 0 ? `⚠️ Alerts (${items.length})` : "✓ All Clear"}
      </h3>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {items.length === 0 ? (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-900 font-bold">No alerts at the moment</p>
            <p className="text-green-700 text-sm">Everything is running smoothly!</p>
          </div>
        ) : (
          items.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`border-2 rounded-lg p-3 ${severityStyles[alert.severity]}`}
            >
              <p className="font-bold text-sm">{alert.title}</p>
              <p className="text-xs opacity-75">{alert.description}</p>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};
