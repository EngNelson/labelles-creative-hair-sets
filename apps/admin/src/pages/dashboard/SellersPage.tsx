import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check,
  X,
  Store,
  Eye,
  Users,
  Clock,
  ShieldCheck,
  UserX,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import SellerDetailSidebar from "@/components/dashboard/search/SellerDetailSidebar";
import { Card, CardContent } from "@/components/ui/card";

const SellersPage = () => {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();
  const { can } = usePermissions();
  const { toast } = useToast();

  // Sidebar state
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Stats toggle state
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.get(
        `${import.meta.env.VITE_NEXT_PUBLIC_API_URL}/api/sellers/requests`,
        config,
      );
      setSellers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching sellers:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load sellers",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    if (!can("manage_sellers")) {
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      await axios.put(
        `${import.meta.env.VITE_NEXT_PUBLIC_API_URL}/api/sellers/${id}/status`,
        { status },
        config,
      );

      toast({
        title: "Success",
        description: `Seller ${status} successfully`,
      });
      fetchSellers(); // Refresh list
    } catch (error) {
      console.error("Error updating seller status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status",
      });
    }
  };

  const handleViewDetails = (id: string) => {
    setSelectedSellerId(id);
    setIsSidebarOpen(true);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = sellers.length;
    const pending = sellers.filter((s) => s.status === "pending").length;
    const approved = sellers.filter((s) => s.status === "approved").length;
    const rejected = sellers.filter((s) => s.status === "rejected").length;
    return { total, pending, approved, rejected };
  }, [sellers]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-border shadow-sm">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>

        <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <Skeleton className="h-6 w-32" />
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Store Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-20 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header section with gradient flair and Stats Toggle */}
        <div className="relative overflow-hidden bg-white p-6 md:p-8 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group">
          <div className="absolute right-0 top-0 w-64 h-full bg-linear-to-l from-primary/5 to-transparent pointer-events-none transition-opacity opacity-0 group-hover:opacity-100 duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                <Store className="w-6 h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Seller Management
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
              Monitor incoming seller applications, review business details, and
              manage the vendor ecosystem on your platform.
            </p>
          </div>
          <div className="relative z-10 shrink-0">
            <Button
              variant="outline"
              onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-2 bg-white hover:bg-muted/50 transition-colors shadow-sm"
            >
              {showStats ? "Hide Statistics" : "Show Statistics"}
              {showStats ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        {showStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 text-blue-600 rounded-full">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Sellers
                  </p>
                  <h3 className="text-2xl font-bold">{stats.total}</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-full">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pending Review
                  </p>
                  <h3 className="text-2xl font-bold">{stats.pending}</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-full">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Approved
                  </p>
                  <h3 className="text-2xl font-bold">{stats.approved}</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-rose-500/10 text-rose-600 rounded-full">
                  <UserX className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Rejected
                  </p>
                  <h3 className="text-2xl font-bold">{stats.rejected}</h3>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sellers Table */}
        <div className="border border-border/60 rounded-xl bg-white shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border/50 bg-gray-50/40 flex justify-between items-center">
            <h2 className="font-semibold text-lg flex items-center gap-2 text-foreground/90">
              All Applicants
              <Badge
                variant="secondary"
                className="font-medium bg-white border shadow-xs text-xs"
              >
                {sellers.length}
              </Badge>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20 border-b-border/40">
                  <TableHead className="py-4 font-semibold text-muted-foreground/80">
                    Store Details
                  </TableHead>
                  <TableHead className="py-4 font-semibold text-muted-foreground/80">
                    Owner Identity
                  </TableHead>
                  <TableHead className="py-4 font-semibold text-muted-foreground/80">
                    Contact Info
                  </TableHead>
                  <TableHead className="py-4 font-semibold text-muted-foreground/80">
                    Status
                  </TableHead>
                  <TableHead className="py-4 font-semibold text-muted-foreground/80">
                    Applied On
                  </TableHead>
                  <TableHead className="py-4 font-semibold text-muted-foreground/80 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellers?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-16 text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Store className="w-8 h-8 opacity-20" />
                        <p>No seller applications found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sellers.map((seller) => (
                    <TableRow
                      key={seller._id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <TableCell className="py-4 align-middle">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 shadow-xs">
                            <Store className="h-5 w-5 text-primary/80" />
                          </div>
                          <div>
                            <span className="font-semibold text-foreground block">
                              {seller.storeName}
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[150px] inline-block opacity-70">
                              ID: {seller._id.substring(0, 8)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 align-middle">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground/90">
                            {seller.userId?.name || "Unknown User"}
                          </span>
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {seller.userId?.email || "No email linked"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 align-middle">
                        <div className="flex flex-col text-sm">
                          <span className="font-medium text-foreground/80">
                            {seller.contactEmail}
                          </span>
                          <span className="text-muted-foreground text-xs mt-0.5">
                            {seller.contactPhone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 align-middle">
                        <Badge
                          className="px-2.5 py-0.5"
                          variant={
                            seller.status === "approved"
                              ? "default"
                              : seller.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {seller.status === "approved" && (
                            <Check className="w-3 h-3 mr-1 inline" />
                          )}
                          {seller.status === "rejected" && (
                            <X className="w-3 h-3 mr-1 inline" />
                          )}
                          {seller.status === "pending" && (
                            <Clock className="w-3 h-3 mr-1 inline" />
                          )}
                          {seller.status.charAt(0).toUpperCase() +
                            seller.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-sm text-muted-foreground">
                        {new Date(seller.createdAt).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-70 sm:group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 shadow-xs"
                            onClick={() => handleViewDetails(seller._id)}
                          >
                            <Eye className="h-4 w-4 mr-1.5" /> View
                          </Button>

                          {seller.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 w-8 p-0"
                                onClick={() =>
                                  updateStatus(seller._id, "rejected")
                                }
                                title="Reject Application"
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Reject</span>
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700 shadow-xs"
                                onClick={() =>
                                  updateStatus(seller._id, "approved")
                                }
                                title="Approve Application"
                              >
                                <Check className="h-4 w-4" />
                                <span className="sr-only">Approve</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <SellerDetailSidebar
        sellerId={selectedSellerId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onUpdate={fetchSellers}
      />
    </>
  );
};

export default SellersPage;
