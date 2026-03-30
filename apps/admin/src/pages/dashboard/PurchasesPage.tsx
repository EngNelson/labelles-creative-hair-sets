import { useState, useEffect } from "react";
import {
  Plus,
  Eye,
  Trash2,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { adminApi } from "@/lib/config";
import { formatCurrency, formatDate } from "@/lib/utils";
import CreateRequisitionSheet from "@/components/purchases/CreateRequisitionSheet";

interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  profitMargin: number;
  sellingPrice: number;
  totalCost: number;
}

interface Purchase {
  _id: string;
  purchaseNumber: string;
  status: "requisition" | "approved" | "purchased" | "received" | "cancelled";
  items: PurchaseItem[];
  totalAmount: number;
  supplier: {
    name: string;
    contact?: string;
    email?: string;
  };
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  expectedDeliveryDate?: string;
}

const statusConfig = {
  requisition: {
    label: "Requisition",
    icon: Clock,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle,
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  purchased: {
    label: "Purchased",
    icon: ShoppingCart,
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  received: {
    label: "Received",
    icon: Package,
    color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showRequisitionSheet, setShowRequisitionSheet] = useState(false);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: "10",
        sortOrder: "desc",
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await adminApi.get(`/purchases?${params}`);
      if (response.data.success) {
        setPurchases(response.data.purchases);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching purchases:", error);
      toast.error("Failed to fetch purchases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this purchase?")) return;

    try {
      const response = await adminApi.delete(`/purchases/${id}`);
      if (response.data.success) {
        toast.success("Purchase deleted successfully");
        fetchPurchases();
      }
    } catch (error) {
      console.error("Error deleting purchase:", error);
      toast.error("Failed to delete purchase");
    }
  };

  const getStatusBadge = (status: Purchase["status"]) => {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purchase Management</h1>
          <p className="text-muted-foreground">
            Manage purchase requisitions, approvals, and inventory
          </p>
        </div>
        <Button onClick={() => setShowRequisitionSheet(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Requisition
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requisitions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {purchases.filter((p) => p.status === "requisition").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {purchases.filter((p) => p.status === "approved").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchased</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {purchases.filter((p) => p.status === "purchased").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {purchases.filter((p) => p.status === "received").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Purchase Orders</CardTitle>
              <CardDescription>
                View and manage all purchase orders
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="requisition">Requisition</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="purchased">Purchased</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No purchases found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase._id}>
                    <TableCell className="font-medium">
                      {purchase.purchaseNumber}
                    </TableCell>
                    <TableCell>{purchase.supplier.name}</TableCell>
                    <TableCell>{purchase.items.length} items</TableCell>
                    <TableCell>
                      {formatCurrency(purchase.totalAmount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                    <TableCell>{purchase.createdBy.name}</TableCell>
                    <TableCell>{formatDate(purchase.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            toast.info("Purchase details coming soon")
                          }
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {purchase.status === "requisition" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(purchase._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Requisition Sheet */}
      <CreateRequisitionSheet
        open={showRequisitionSheet}
        onClose={() => setShowRequisitionSheet(false)}
        onSuccess={fetchPurchases}
      />
    </div>
  );
}
