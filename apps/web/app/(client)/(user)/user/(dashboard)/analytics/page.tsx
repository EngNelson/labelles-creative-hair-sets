"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUserStore } from "@/lib/store";
import {
  getUserAnalyticsOverview,
  getUserMonthlySpending,
  getUserProductPreferences,
  UserAnalyticsOverview,
  MonthlySpending,
  ProductPreferences,
} from "@/lib/userAnalyticsApi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Color schemes for charts
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82ca9d",
];
const STATUS_COLORS = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  shipped: "#8b5cf6",
  delivered: "#10b981",
  completed: "#059669",
  cancelled: "#ef4444",
  paid: "#10b981",
};

export default function AnalyticsPage() {
  const router = useRouter();
  const { authUser, auth_token, isAuthenticated, verifyAuth } = useUserStore();

  const [overview, setOverview] = useState<UserAnalyticsOverview | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlySpending | null>(null);
  const [preferences, setPreferences] = useState<ProductPreferences | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verify authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      setAuthLoading(true);
      if (auth_token && !authUser) {
        await verifyAuth();
      }
      setAuthLoading(false);
    };

    checkAuth();
  }, [auth_token, authUser, verifyAuth]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && auth_token) {
      fetchAnalyticsData();
    } else if (!authLoading && !isAuthenticated) {
      router.push("/auth/signin");
    }
  }, [authLoading, isAuthenticated, auth_token, router]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewData, monthlySpendingData, preferencesData] =
        await Promise.all([
          getUserAnalyticsOverview(),
          getUserMonthlySpending(12),
          getUserProductPreferences(),
        ]);

      setOverview(overviewData);
      setMonthlyData(monthlySpendingData);
      setPreferences(preferencesData);
    } catch (error) {
      console.error("Analytics data fetch error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch analytics data",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
      case "paid":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
      case "processing":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="border border-border rounded-xl p-4 space-y-3 bg-card"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
        {/* Chart skeleton */}
        <div className="border border-border rounded-xl p-4 bg-card space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <BarChart3 className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to Load Analytics
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!overview || !monthlyData || !preferences) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Analytics Data Available
          </h3>
          <p className="text-gray-600">
            Start shopping to see your analytics data here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Shopping Analytics
          </h2>
          <p className="text-gray-600">
            Track your shopping patterns and spending habits
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(
          [
            {
              label: "Total Orders",
              value: formatNumber(overview.overview.totalOrders),
              sub: `${overview.overview.completedOrders} completed`,
              icon: <ShoppingCart className="w-4 h-4" />,
              accent: "border-blue-500",
              iconBg: "bg-blue-100 text-blue-600",
            },
            {
              label: "Total Spent",
              value: formatCurrency(overview.overview.totalSpent),
              sub: `${formatCurrency(overview.overview.paidAmount)} paid`,
              icon: <DollarSign className="w-4 h-4" />,
              accent: "border-green-500",
              iconBg: "bg-green-100 text-green-600",
            },
            {
              label: "Avg Order Value",
              value: formatCurrency(overview.overview.avgOrderValue),
              sub: "Per order average",
              icon: <TrendingUp className="w-4 h-4" />,
              accent: "border-purple-500",
              iconBg: "bg-purple-100 text-purple-600",
            },
            {
              label: "Items Purchased",
              value: formatNumber(overview.overview.totalItems),
              sub: "Total items bought",
              icon: <Package className="w-4 h-4" />,
              accent: "border-orange-500",
              iconBg: "bg-orange-100 text-orange-600",
            },
          ] as const
        ).map(({ label, value, sub, icon, accent, iconBg }) => (
          <div
            key={label}
            className={`border-l-4 ${accent} border border-border rounded-xl p-4 bg-card shadow-sm`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">
                {label}
              </p>
              <span className={`p-1.5 rounded-lg ${iconBg}`}>{icon}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts and Tables */}
      <Tabs defaultValue="spending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4">
          <TabsTrigger value="spending">Monthly Spending</TabsTrigger>
          <TabsTrigger value="status">Order Status</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
        </TabsList>

        <TabsContent value="spending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Spending Trend</CardTitle>
              <CardDescription>
                Your spending pattern over the last 12 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData.monthlySpending}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="monthName"
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={
                        ((value: number, name: string) => [
                          formatCurrency(value),
                          name === "totalSpent" ? "Total Spent" : "Paid Amount",
                        ]) as any
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="totalSpent"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="paidAmount"
                      stackId="2"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
                <CardDescription>
                  Breakdown of your orders by status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overview.spendingByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: any) =>
                          `${props._id}: ${props.orderCount}`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="orderCount"
                      >
                        {overview.spendingByStatus.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              STATUS_COLORS[
                                entry._id as keyof typeof STATUS_COLORS
                              ] || COLORS[index % COLORS.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Summary</CardTitle>
                <CardDescription>
                  Detailed breakdown by order status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overview.spendingByStatus.map((status) => (
                    <div
                      key={status._id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status._id)}
                        <span className="font-medium capitalize">
                          {status._id}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {status.orderCount} orders
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(status.totalAmount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Favorite Categories</CardTitle>
                <CardDescription>Your top spending categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overview.favoriteCategories}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="_id"
                        tick={{ fontSize: 12 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={
                          ((value: number) => [
                            formatCurrency(value),
                            "Total Spent",
                          ]) as any
                        }
                      />
                      <Bar dataKey="totalSpent" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Details</CardTitle>
                <CardDescription>
                  Items and spending by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overview.favoriteCategories.slice(0, 5).map((category) => (
                    <div
                      key={category._id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                    >
                      <div>
                        <div className="font-medium">
                          {category._id || "Uncategorized"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {category.itemCount} items
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(category.totalSpent)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {category.orderCount} orders
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Purchased Products</CardTitle>
              <CardDescription>
                Your top 10 most frequently bought items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Product</th>
                      <th className="text-right py-2">Quantity</th>
                      <th className="text-right py-2">Total Spent</th>
                      <th className="text-right py-2">Avg Price</th>
                      <th className="text-right py-2">Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preferences.mostPurchasedProducts.map((product) => (
                      <tr
                        key={product._id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <Image
                              src={product.productImage}
                              alt={product.productName}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded object-cover"
                            />
                            <div>
                              <div className="font-medium line-clamp-1">
                                {product.productName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {product.category}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-3 font-medium">
                          {product.totalQuantity}
                        </td>
                        <td className="text-right py-3 font-medium">
                          {formatCurrency(product.totalSpent)}
                        </td>
                        <td className="text-right py-3">
                          {formatCurrency(product.avgPrice)}
                        </td>
                        <td className="text-right py-3">
                          {product.orderCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
