"use client";

import { useEffect, useState } from "react";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Plus,
  Settings,
  BarChart3,
  ArrowUpRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import Cookies from "js-cookie";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalProducts: number;
  pendingProducts: number;
  totalSoldItems: number;
  totalOrders: number;
  totalRevenue: number;
}

export default function SellerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    pendingProducts: 0,
    totalSoldItems: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = Cookies.get("auth_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sellers/dashboard/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      href: "/seller/products",
      trend: "+12%",
      trendUp: true,
    },
    {
      name: "Pending Approval",
      value: stats.pendingProducts,
      icon: Clock,
      iconBg: "bg-accent/10",
      iconColor: "text-accent",
      href: "/seller/products?status=pending",
      badge: stats.pendingProducts > 0 ? "Needs Attention" : "All Clear",
      badgeVariant: stats.pendingProducts > 0 ? "destructive" : "default",
    },
    {
      name: "Items Sold",
      value: stats.totalSoldItems || 0,
      icon: CheckCircle2,
      iconBg: "bg-green-500/10",
      iconColor: "text-green-500",
      href: "/seller/analytics",
      trend: "+15%",
      trendUp: true,
    },
    {
      name: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      href: "/seller/orders",
      trend: "+8%",
      trendUp: true,
    },
    {
      name: "Total Revenue",
      value: `$${(stats.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      href: "/seller/analytics",
      trend: "+23%",
      trendUp: true,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Seller Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your products, orders, and view your store performance
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-border/60 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors"
          >
            <Link href="/seller/products">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/seller/products">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card
            key={stat.name}
            className="hover:shadow-md transition-all duration-200 cursor-pointer group border-border/60"
          >
            <Link href={stat.href}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.name}
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    {stat.trend && (
                      <div className="flex items-center gap-1">
                        <TrendingUp
                          className={`h-4 w-4 ${stat.trendUp ? "text-green-600" : "text-red-600"}`}
                        />
                        <span
                          className={`text-xs font-medium ${stat.trendUp ? "text-green-600" : "text-red-600"}`}
                        >
                          {stat.trend}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          from last month
                        </span>
                      </div>
                    )}
                    {stat.badge && (
                      <Badge
                        variant={stat.badgeVariant as any}
                        className="text-xs"
                      >
                        {stat.badge}
                      </Badge>
                    )}
                  </div>
                  <div
                    className={`${stat.iconBg} p-3 rounded-lg group-hover:scale-110 transition-transform`}
                  >
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {/* Welcome Banner */}
      <Card className="border-border/60 bg-primary text-primary-foreground shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-white/5 pointer-events-none transform translate-x-12 -skew-x-12"></div>
        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
                <h2 className="text-2xl font-bold">
                  Welcome to Your Seller Portal!
                </h2>
              </div>
              <p className="text-primary-foreground/90 text-lg">
                Start adding products to your store and manage your inventory.
                All products will be reviewed by our admin team before going
                live.
              </p>
            </div>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="shrink-0 bg-white text-primary hover:bg-white/90"
            >
              <Link href="/seller/products">
                Get Started
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to help you manage your store efficiently
          </CardDescription>
        </CardHeader>
        <Separator className="bg-border/60" />
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              asChild
              variant="outline"
              className="h-auto py-6 flex-col gap-2 border-border/60 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-colors"
            >
              <Link href="/seller/products">
                <div className="p-3 bg-primary/10 rounded-lg mb-2 text-primary">
                  <Package className="h-6 w-6" />
                </div>
                <span className="font-semibold text-foreground">
                  Add New Product
                </span>
                <span className="text-xs text-muted-foreground">
                  List products for sale
                </span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto py-6 flex-col gap-2 border-border/60 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-colors"
            >
              <Link href="/seller/products">
                <div className="p-3 bg-primary/10 rounded-lg mb-2 text-primary">
                  <Settings className="h-6 w-6" />
                </div>
                <span className="font-semibold text-foreground">
                  Manage Inventory
                </span>
                <span className="text-xs text-muted-foreground">
                  Update stock & prices
                </span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto py-6 flex-col gap-2 border-border/60 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-colors"
            >
              <Link href="/seller/orders">
                <div className="p-3 bg-primary/10 rounded-lg mb-2 text-primary">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <span className="font-semibold text-foreground">
                  Process Orders
                </span>
                <span className="text-xs text-muted-foreground">
                  View & fulfill orders
                </span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto py-6 flex-col gap-2 border-border/60 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-colors"
            >
              <Link href="/seller/analytics">
                <div className="p-3 bg-primary/10 rounded-lg mb-2 text-primary">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <span className="font-semibold text-foreground">
                  View Analytics
                </span>
                <span className="text-xs text-muted-foreground">
                  Track performance
                </span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto py-6 flex-col gap-2 border-border/60 hover:bg-accent/5 hover:border-accent/20 hover:text-accent transition-colors"
            >
              <Link href="/seller/products?status=pending">
                <div className="p-3 bg-accent/10 rounded-lg mb-2 text-accent">
                  <Clock className="h-6 w-6" />
                </div>
                <span className="font-semibold text-foreground">
                  Pending Review
                </span>
                <span className="text-xs text-muted-foreground">
                  {stats.pendingProducts} items waiting
                </span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto py-6 flex-col gap-2 border-border/60 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-colors"
            >
              <Link href="/seller/products">
                <div className="p-3 bg-primary/10 rounded-lg mb-2 text-primary">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <span className="font-semibold text-foreground">
                  Store Settings
                </span>
                <span className="text-xs text-muted-foreground">
                  Configure your store
                </span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
