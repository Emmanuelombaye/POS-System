import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export const SalesLineChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis dataKey="date" stroke="#9ca3af" />
      <YAxis stroke="#9ca3af" />
      <Tooltip 
        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
        labelStyle={{ color: "#f3f4f6" }}
      />
      <Legend />
      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
      <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
    </LineChart>
  </ResponsiveContainer>
);

export const BranchComparisonChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis dataKey="branch" stroke="#9ca3af" />
      <YAxis stroke="#9ca3af" />
      <Tooltip 
        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
        labelStyle={{ color: "#f3f4f6" }}
      />
      <Legend />
      <Bar dataKey="revenue" fill="#10b981" />
      <Bar dataKey="profit" fill="#3b82f6" />
    </BarChart>
  </ResponsiveContainer>
);

export const TopProductsChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart
      data={data}
      layout="vertical"
      margin={{ top: 5, right: 30, left: 200 }}
    >
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis type="number" stroke="#9ca3af" />
      <YAxis dataKey="name" type="category" width={190} stroke="#9ca3af" />
      <Tooltip 
        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
        labelStyle={{ color: "#f3f4f6" }}
      />
      <Bar dataKey="revenue" fill="#f59e0b" />
    </BarChart>
  </ResponsiveContainer>
);

export const CategoryPieChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={true}
        label={({ name, percentage }) => `${name} ${percentage}%`}
        outerRadius={100}
        fill="#8884d8"
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip 
        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
        labelStyle={{ color: "#f3f4f6" }}
      />
    </PieChart>
  </ResponsiveContainer>
);

export const HourlyActivityChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis dataKey="hour" stroke="#9ca3af" />
      <YAxis stroke="#9ca3af" />
      <Tooltip 
        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
        labelStyle={{ color: "#f3f4f6" }}
      />
      <Legend />
      <Area type="monotone" dataKey="sales" fill="#10b981" stroke="#10b981" />
      <Area type="monotone" dataKey="transactions" fill="#3b82f6" stroke="#3b82f6" />
    </AreaChart>
  </ResponsiveContainer>
);

export const PaymentMethodChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={true}
        label={({ name, value }) => `${name}: KES ${(value / 1000).toFixed(0)}K`}
        outerRadius={100}
        fill="#8884d8"
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip 
        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
        labelStyle={{ color: "#f3f4f6" }}
      />
    </PieChart>
  </ResponsiveContainer>
);

export const LossTrackingChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis dataKey="date" stroke="#9ca3af" />
      <YAxis stroke="#9ca3af" />
      <Tooltip 
        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
        labelStyle={{ color: "#f3f4f6" }}
      />
      <Legend />
      <Bar dataKey="refunds" fill="#ef4444" />
      <Bar dataKey="voids" fill="#f97316" />
      <Bar dataKey="expired" fill="#a16207" />
    </BarChart>
  </ResponsiveContainer>
);

export const MonthGrowthChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis dataKey="month" stroke="#9ca3af" />
      <YAxis stroke="#9ca3af" />
      <Tooltip 
        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
        labelStyle={{ color: "#f3f4f6" }}
      />
      <Legend />
      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
      <Line type="monotone" dataKey="lastYear" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" />
    </LineChart>
  </ResponsiveContainer>
);
