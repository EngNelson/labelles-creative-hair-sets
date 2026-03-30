import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  CalendarDays,
  Globe,
  Monitor,
} from "lucide-react";
import { format } from "date-fns";

type Subscription = {
  _id: string;
  email: string;
  source: "modal" | "footer" | "manual";
  status: "active" | "unsubscribed";
  preferences?: {
    frequency?: string;
    categories?: string[];
  };
  subscribedAt: string;
  unsubscribedAt?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
};

type SubscriptionStats = {
  total: number;
  active: number;
  unsubscribed: number;
  modal: number;
  footer: number;
  manual: number;
  recentGrowth: number;
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats>({
    total: 0,
    active: 0,
    unsubscribed: 0,
    modal: 0,
    footer: 0,
    manual: 0,
    recentGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] =
    useState<Subscription | null>(null);
  const [deleting, setDeleting] = useState(false);

  const axiosPrivate = useAxiosPrivate();
  const { toast } = useToast();

  const totalPages = Math.ceil(total / perPage);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {
        page,
        limit: perPage,
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== "all") params.status = statusFilter;
      if (sourceFilter !== "all") params.source = sourceFilter;

      const response = await axiosPrivate.get("/subscriptions", {
        params,
      });

      setSubscriptions(response.data.subscriptions || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      toast({
        title: "Error",
        description:
          (error as { response?: { data?: { message?: string } } }).response
            ?.data?.message || "Failed to fetch subscriptions",
        variant: "destructive",
      });
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axiosPrivate.get("/subscriptions/stats");
      setStats(response.data || stats);
    } catch (error) {
      console.error("Failed to fetch subscription stats:", error);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, statusFilter, sourceFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSubscriptions(), fetchStats()]);
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Subscription data has been refreshed",
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleViewSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsSheetOpen(true);
  };

  const handleDeleteClick = (subscription: Subscription) => {
    setSubscriptionToDelete(subscription);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!subscriptionToDelete) return;

    try {
      setDeleting(true);
      await axiosPrivate.delete(`/subscriptions/${subscriptionToDelete._id}`);

      toast({
        title: "Success",
        description: "Subscription deleted successfully",
      });

      setDeleteDialogOpen(false);
      setSubscriptionToDelete(null);
      await Promise.all([fetchSubscriptions(), fetchStats()]);
    } catch (error) {
      toast({
        title: "Error",
        description:
          (error as { response?: { data?: { message?: string } } }).response
            ?.data?.message || "Failed to delete subscription",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getSourceBadge = (source: string) => {
    const colors = {
      modal: "bg-blue-100 text-blue-700 dark:bg-blue-600/20 dark:text-blue-300",
      footer:
        "bg-green-100 text-green-700 dark:bg-green-600/20 dark:text-green-300",
      manual:
        "bg-purple-100 text-purple-700 dark:bg-purple-600/20 dark:text-purple-300",
    };
    return colors[source as keyof typeof colors] || colors.manual;
  };

  const getStatusBadge = (status: string) => {
    return status === "active"
      ? "bg-green-100 text-green-700 dark:bg-green-600/20 dark:text-green-300"
      : "bg-red-100 text-red-700 dark:bg-red-600/20 dark:text-red-300";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Subscriptions
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage newsletter subscriptions and email preferences
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-600/10"
        >
          <RefreshCw
            size={16}
            className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="border-2 border-indigo-100 dark:border-indigo-500/20 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Subscribers
            </CardTitle>
            <Users className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {stats.total}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time subscriptions
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-100 dark:border-green-500/20 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently subscribed
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-100 dark:border-red-500/20 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unsubscribed
            </CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.unsubscribed}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Opted out users
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-100 dark:border-purple-500/20 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recent Growth
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              +{stats.recentGrowth}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              type="text"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter size={16} className="mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-40">
                <Filter size={16} className="mr-2" />
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="modal">Modal</SelectItem>
                <SelectItem value="footer">Footer</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>

            {(statusFilter !== "all" || sourceFilter !== "all") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStatusFilter("all");
                  setSourceFilter("all");
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-600/10"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Source breakdown */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-muted-foreground">Modal:</span>
            <span className="font-semibold">{stats.modal}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-muted-foreground">Footer:</span>
            <span className="font-semibold">{stats.footer}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-muted-foreground">Manual:</span>
            <span className="font-semibold">{stats.manual}</span>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Source</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Subscribed At</TableHead>
                <TableHead className="font-semibold text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <Mail className="mx-auto h-12 w-12 text-slate-300 mb-2" />
                    <p className="text-lg font-medium">
                      No subscriptions found
                    </p>
                    <p className="text-sm mt-1">
                      {searchTerm ||
                      statusFilter !== "all" ||
                      sourceFilter !== "all"
                        ? "Try adjusting your filters"
                        : "Start collecting email subscriptions"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((subscription) => (
                  <TableRow
                    key={subscription._id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <TableCell className="font-medium">
                      {subscription.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getSourceBadge(subscription.source)}
                      >
                        {subscription.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusBadge(subscription.status)}
                      >
                        {subscription.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(
                        new Date(subscription.subscribedAt),
                        "MMM dd, yyyy HH:mm"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewSubscription(subscription)}
                          className="hover:bg-indigo-50 dark:hover:bg-indigo-600/10 hover:text-indigo-600"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(subscription)}
                          className="hover:bg-red-50 dark:hover:bg-red-600/10 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * perPage + 1} to{" "}
              {Math.min(page * perPage, total)} of {total} subscriptions
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft size={16} className="mr-1" />
                Previous
              </Button>
              <span className="text-sm font-medium">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* View Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Subscription Details</SheetTitle>
          </SheetHeader>

          {selectedSubscription && (
            <div className="mt-6 space-y-6">
              {/* Email */}
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <Mail size={16} />
                  Email Address
                </label>
                <p className="text-base font-semibold break-all">
                  {selectedSubscription.email}
                </p>
              </div>

              <Separator />

              {/* Status & Source */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Status
                  </label>
                  <Badge
                    variant="outline"
                    className={getStatusBadge(selectedSubscription.status)}
                  >
                    {selectedSubscription.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Source
                  </label>
                  <Badge
                    variant="outline"
                    className={getSourceBadge(selectedSubscription.source)}
                  >
                    {selectedSubscription.source}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Dates */}
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <CalendarDays size={16} />
                  Subscribed At
                </label>
                <p className="text-base">
                  {format(
                    new Date(selectedSubscription.subscribedAt),
                    "MMMM dd, yyyy 'at' HH:mm:ss"
                  )}
                </p>
              </div>

              {selectedSubscription.unsubscribedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                    <CalendarDays size={16} />
                    Unsubscribed At
                  </label>
                  <p className="text-base">
                    {format(
                      new Date(selectedSubscription.unsubscribedAt),
                      "MMMM dd, yyyy 'at' HH:mm:ss"
                    )}
                  </p>
                </div>
              )}

              <Separator />

              {/* Technical Info */}
              {selectedSubscription.ipAddress && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                    <Globe size={16} />
                    IP Address
                  </label>
                  <p className="text-sm font-mono">
                    {selectedSubscription.ipAddress}
                  </p>
                </div>
              )}

              {selectedSubscription.userAgent && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                    <Monitor size={16} />
                    User Agent
                  </label>
                  <p className="text-sm break-all text-muted-foreground">
                    {selectedSubscription.userAgent}
                  </p>
                </div>
              )}

              {/* Preferences */}
              {selectedSubscription.preferences &&
                Object.keys(selectedSubscription.preferences).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Preferences
                      </label>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                        <pre className="text-xs">
                          {JSON.stringify(
                            selectedSubscription.preferences,
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </div>
                  </>
                )}

              {/* Actions */}
              <div className="pt-4">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    setIsSheetOpen(false);
                    handleDeleteClick(selectedSubscription);
                  }}
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete Subscription
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the subscription for{" "}
              <span className="font-semibold text-foreground">
                {subscriptionToDelete?.email}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
