// Mock analytics data generator for realistic POS testing
export const generateMockAnalyticsData = (days: number = 30) => {
  const data = [];
  const branches = ["Tamasha", "Reem", "LungaLunga"];
  const categories = ["Beef", "Mutton", "Chicken", "Pork", "Fish", "Offal"];
  const products = [
    "Beef Ribs", "Beef Steak", "Ground Beef", "Beef Liver",
    "Lamb Chops", "Lamb Leg", "Lamb Ribs",
    "Chicken Breast", "Chicken Thighs", "Whole Chicken",
    "Pork Chops", "Pork Leg", "Bacon",
    "Fish Fillet", "Whole Fish",
    "Beef Intestines", "Chicken Gizzards"
  ];
  const paymentMethods = ["Cash", "M-Pesa", "Card"];

  // Sales over time
  const salesByDay = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseSales = 45000 + Math.random() * 35000;
    const multiplier = isWeekend ? 1.3 : 1;
    
    salesByDay.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.round(baseSales * multiplier),
      orders: Math.round(80 + Math.random() * 120),
      cost: Math.round(baseSales * multiplier * 0.6),
    });
  }

  // Revenue by branch
  const branchData = branches.map(branch => ({
    branch,
    revenue: 45000 + Math.random() * 55000,
    profit: 12000 + Math.random() * 18000,
    orders: 85 + Math.random() * 100,
  }));

  // Top products
  const topProducts = products.slice(0, 10).map((product, i) => ({
    name: product,
    sold: 45 - i * 3 + Math.random() * 10,
    revenue: (45000 - i * 3000) + Math.random() * 5000,
  }));

  // Category breakdown
  const categoryData = categories.map(cat => ({
    name: cat,
    value: 12000 + Math.random() * 15000,
    percentage: 0,
  }));
  const totalCategory = categoryData.reduce((sum, item) => sum + item.value, 0);
  categoryData.forEach(item => {
    item.percentage = Math.round((item.value / totalCategory) * 100);
  });

  // Cashier performance
  const cashiers = [
    { name: "Alice Cashier", branch: "Tamasha" },
    { name: "Bob Cashier", branch: "Reem" },
    { name: "Carol Cashier", branch: "LungaLunga" },
  ];
  const cashierPerformance = cashiers.map((cashier, i) => ({
    name: cashier.name,
    branch: cashier.branch,
    sales: 120000 - i * 20000 + Math.random() * 15000,
    transactions: 280 - i * 40 + Math.random() * 30,
    avgTransaction: 0,
  }));
  cashierPerformance.forEach(c => {
    c.avgTransaction = Math.round(c.sales / c.transactions);
  });

  // Payment methods
  const paymentData = paymentMethods.map(method => ({
    name: method,
    value: Math.round(150000 / 3 + Math.random() * 20000),
  }));

  // Hourly sales
  const hourlyData = [];
  for (let hour = 6; hour < 18; hour++) {
    hourlyData.push({
      hour: `${hour}:00`,
      sales: 3000 + Math.random() * 6000,
      transactions: 8 + Math.random() * 12,
    });
  }

  // Low stock alerts
  const lowStockItems = [
    { product: "Beef Ribs", current: 8, reorderLevel: 20 },
    { product: "Lamb Leg", current: 5, reorderLevel: 15 },
    { product: "Bacon", current: 12, reorderLevel: 25 },
    { product: "Whole Fish", current: 3, reorderLevel: 10 },
  ];

  // Loss/Voids
  const lossData = [
    { date: "Mon", refunds: 2500, voids: 1200, expired: 800 },
    { date: "Tue", refunds: 1800, voids: 900, expired: 500 },
    { date: "Wed", refunds: 3200, voids: 1500, expired: 1200 },
    { date: "Thu", refunds: 2100, voids: 1100, expired: 700 },
    { date: "Fri", refunds: 3500, voids: 1800, expired: 1500 },
    { date: "Sat", refunds: 4200, voids: 2200, expired: 1800 },
    { date: "Sun", refunds: 3800, voids: 2000, expired: 1600 },
  ];

  // Month over month growth
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const monthGrowth = months.map((month, i) => ({
    month,
    revenue: 1200000 + i * 150000 + Math.random() * 50000,
    lastYear: 950000 + i * 100000 + Math.random() * 30000,
  }));

  return {
    summary: {
      totalRevenue: salesByDay.reduce((sum, day) => sum + day.revenue, 0),
      totalProfit: Math.round(salesByDay.reduce((sum, day) => sum + day.revenue * 0.35, 0)),
      totalOrders: salesByDay.reduce((sum, day) => sum + day.orders, 0),
      avgOrderValue: 0,
      totalRefunds: 3500,
      totalVoids: 1500,
    },
    salesByDay,
    branchData,
    topProducts,
    categoryData,
    cashierPerformance,
    paymentData,
    hourlyData,
    lowStockItems,
    lossData,
    monthGrowth,
  };
};

// Calculate summary metrics
export const calculateSummary = (data: any) => {
  data.summary.avgOrderValue = Math.round(data.summary.totalRevenue / data.summary.totalOrders);
  return data;
};
