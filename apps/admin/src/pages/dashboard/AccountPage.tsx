import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { useToast } from "@/hooks/use-toast";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Package,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Eye,
  Edit,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { motion } from "framer-motion";
import DashboardSkeleton from "@/components/skeleton/DashboardSkeleton";

interface OverviewData {
  overview: {
    totalProducts: number;
    totalOrders: number;
    totalUsers: number;
    totalRevenue: number;
  };
  sales: {
    bestSellingProducts: Array<{
      _id: string;
      productName: string;
      totalSold: number;
      totalRevenue: number;
    }>;
    recentOrders: Array<{
      _id: string;
      userId: {
        user: string;
      };
      total: number;
      status: string;
      createdAt: string;
    }>;
    monthlyRevenue: Array<{
      month: string;
      revenue: number;
      orders: number;
    }>;
    orderStatusBreakdown: Array<{
      status: string;
      count: number;
    }>;
  };
}

interface InventoryAlert {
  _id: string;
  name: string;
  stock: number;
  price: number;
  category: { name: string };
  brand: { name: string };
  lastSaleDate?: string;
  daysSinceLastSale?: number;
}

interface InventoryAlerts {
  lowStock: InventoryAlert[];
  outOfStock: InventoryAlert[];
  staleProducts: InventoryAlert[];
  noSalesProducts: InventoryAlert[];
}

const COLORS = [
  "hsl(217, 91%, 60%)", // Blue
  "hsl(221, 83%, 53%)", // Indigo
  "hsl(262, 83%, 58%)", // Purple
  "hsl(350, 87%, 55%)", // Red
  "hsl(120, 60%, 50%)", // Green
  "hsl(45, 100%, 51%)", // Yellow
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function AccountPage() {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [inventoryAlerts, setInventoryAlerts] =
    useState<InventoryAlerts | null>(null);
  const [loading, setLoading] = useState(true);
  const axiosPrivate = useAxiosPrivate();
  const { toast } = useToast();

  const fetchOverviewData = async () => {
    try {
      const response = await axiosPrivate.get("/analytics/overview");
      setOverviewData(response?.data?.data);
    } catch (error) {
      console.error("Error fetching overview data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch overview data",
        variant: "destructive",
      });
    }
  };

  const fetchInventoryAlerts = async () => {
    try {
      const response = await axiosPrivate.get("/analytics/inventory-alerts");

      setInventoryAlerts(response?.data?.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching inventory alerts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch inventory alerts",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchOverviewData();
      await fetchInventoryAlerts();
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Account Overview
          </h1>
          <p className="text-muted-foreground">
            Complete analytics and insights for your e-commerce business
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Last 30 days
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={itemVariants}
      >
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(overviewData?.overview?.totalRevenue || 0)}
          description="+12.5% from last month"
          icon={<DollarSign className="w-4 h-4" />}
          className="bg-linear-to-br from-green-50 to-emerald-50 border-green-200"
        />
        <StatsCard
          title="Total Orders"
          value={overviewData?.overview?.totalOrders || 0}
          description="+8.3% from last month"
          icon={<ShoppingBag className="w-4 h-4" />}
          className="bg-linear-to-br from-blue-50 to-cyan-50 border-blue-200"
          href="/dashboard/orders"
        />
        <StatsCard
          title="Total Products"
          value={overviewData?.overview?.totalProducts || 0}
          description={`${
            inventoryAlerts?.lowStock?.length || 0
          } low stock alerts`}
          icon={<Package className="w-4 h-4" />}
          className="bg-linear-to-br from-purple-50 to-violet-50 border-purple-200"
          href="/dashboard/products"
        />
        <StatsCard
          title="Total Users"
          value={overviewData?.overview?.totalUsers || 0}
          description="+15.2% from last month"
          icon={<Users className="w-4 h-4" />}
          className="bg-linear-to-br from-orange-50 to-amber-50 border-orange-200"
          href="/dashboard/users"
        />
      </motion.div>

      {/* Inventory Alerts */}
      {((inventoryAlerts?.lowStock?.length || 0) > 0 ||
        (inventoryAlerts?.outOfStock?.length || 0) > 0) && (
        <motion.div variants={itemVariants}>
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-5 h-5" />
                Inventory Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {(inventoryAlerts?.outOfStock?.length || 0) > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Out of Stock ({inventoryAlerts?.outOfStock?.length || 0})
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {inventoryAlerts?.outOfStock
                        ?.slice(0, 3)
                        .map((product) => (
                          <div
                            key={product._id}
                            className="flex items-center justify-between p-2 bg-white rounded border"
                          >
                            <div>
                              <p className="font-medium text-sm">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatCurrency(product.price)}
                              </p>
                            </div>
                            <Button asChild size="sm" variant="outline">
                              <Link
                                to={`/dashboard/products?edit=${product._id}`}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Link>
                            </Button>
                          </div>
                        ))}
                      {(inventoryAlerts?.outOfStock?.length || 0) > 3 && (
                        <Button
                          asChild
                          variant="link"
                          size="sm"
                          className="w-full"
                        >
                          <Link to="/dashboard/products?filter=out-of-stock">
                            View all {inventoryAlerts?.outOfStock?.length || 0}{" "}
                            products
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {(inventoryAlerts?.lowStock?.length || 0) > 0 && (
                  <div>
                    <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Low Stock ({inventoryAlerts?.lowStock?.length || 0})
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {inventoryAlerts?.lowStock?.slice(0, 3).map((product) => (
                        <div
                          key={product._id}
                          className="flex items-center justify-between p-2 bg-white rounded border"
                        >
                          <div>
                            <p className="font-medium text-sm">
                              {product.name}
                            </p>
                            <p className="text-xs text-orange-600">
                              Stock: {product.stock} |{" "}
                              {formatCurrency(product.price)}
                            </p>
                          </div>
                          <Button asChild size="sm" variant="outline">
                            <Link
                              to={`/dashboard/products?edit=${product._id}`}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Link>
                          </Button>
                        </div>
                      ))}
                      {(inventoryAlerts?.lowStock?.length || 0) > 3 && (
                        <Button
                          asChild
                          variant="link"
                          size="sm"
                          className="w-full"
                        >
                          <Link to="/dashboard/products?filter=low-stock">
                            View all {inventoryAlerts?.lowStock?.length || 0}{" "}
                            products
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Monthly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={overviewData?.sales?.monthlyRevenue || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value),
                      "Revenue",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(217, 91%, 60%)"
                    strokeWidth={3}
                    dot={{ fill: "hsl(217, 91%, 60%)", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Order Status Breakdown */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={overviewData?.sales?.orderStatusBreakdown || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ _id, percent }) =>
                      `${_id} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(overviewData?.sales?.orderStatusBreakdown || []).map(
                      (_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      )
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Best Selling Products */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Best Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overviewData?.sales?.bestSellingProducts
                  ?.slice(0, 5)
                  .map((product, index) => (
                    <div
                      key={product._id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.productName}</p>
                          <p className="text-sm text-gray-500">
                            {product.totalSold} sold •{" "}
                            {formatCurrency(product.totalRevenue)}
                          </p>
                        </div>
                      </div>
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/dashboard/products?view=${product._id}`}>
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>
                  ))}
                {(overviewData?.sales?.bestSellingProducts?.length || 0) ===
                  0 && (
                  <p className="text-center text-gray-500 py-4">
                    No sales data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Orders */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overviewData?.sales?.recentOrders?.slice(0, 5).map((order) => (
                  <div
                    key={order._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">#{order._id}</p>
                      <p className="text-sm text-gray-500">
                        {order?.userId?.user} • {formatDate(order.createdAt)}
                      </p>
                      <p className="text-sm font-medium">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/dashboard/orders?view=${order._id}`}>
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
                {(overviewData?.sales?.recentOrders?.length || 0) === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    No recent orders
                  </p>
                )}
                <Button asChild className="w-full" variant="outline">
                  <Link to="/dashboard/orders">View All Orders</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Additional Inventory Insights */}
      {((inventoryAlerts?.staleProducts?.length || 0) > 0 ||
        (inventoryAlerts?.noSalesProducts?.length || 0) > 0) && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Product Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {(inventoryAlerts?.staleProducts?.length || 0) > 0 && (
                  <div>
                    <h4 className="font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Stale Products (
                      {inventoryAlerts?.staleProducts?.length || 0})
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Products with no sales in the last 90 days
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {inventoryAlerts?.staleProducts
                        ?.slice(0, 3)
                        .map((product) => (
                          <div
                            key={product._id}
                            className="flex items-center justify-between p-2 bg-yellow-50 rounded border"
                          >
                            <div>
                              <p className="font-medium text-sm">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {product.daysSinceLastSale} days since last sale
                              </p>
                            </div>
                            <Button asChild size="sm" variant="outline">
                              <Link
                                to={`/dashboard/products?edit=${product._id}`}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Review
                              </Link>
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {(inventoryAlerts?.noSalesProducts?.length || 0) > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      No Sales ({inventoryAlerts?.noSalesProducts?.length || 0})
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Products that have never been sold
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {inventoryAlerts?.noSalesProducts
                        ?.slice(0, 3)
                        .map((product) => (
                          <div
                            key={product._id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                          >
                            <div>
                              <p className="font-medium text-sm">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatCurrency(product.price)} • Stock:{" "}
                                {product.stock}
                              </p>
                            </div>
                            <Button asChild size="sm" variant="outline">
                              <Link
                                to={`/dashboard/products?edit=${product._id}`}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Review
                              </Link>
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
