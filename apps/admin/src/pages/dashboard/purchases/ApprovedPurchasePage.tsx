import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Eye,
  ShoppingCart,
  Package,
  RefreshCw,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { adminApi } from "@/lib/config";
import { formatCurrency, formatDate } from "@/lib/utils";
import PurchaseDetailsSheet from "@/components/purchases/PurchaseDetailsSheet";

interface PurchaseItem {
  productId: {
    _id: string;
    name: string;
    image?: string;
  };
  productName: string;
  quantity: number;
  purchasePrice: number;
  profitMargin: number;
  sellingPrice: number;
  totalCost: number;
  currentPrice?: number;
}

interface Purchase {
  _id: string;
  purchaseNumber: string;
  items: PurchaseItem[];
  totalAmount: number;
  supplier: {
    name: string;
    contact: string;
  };
  status: string;
  notes?: string;
  createdBy: {
    id: string;
    name: string;
  };
  approvedBy?: {
    id: string;
    name: string;
    at: string;
  };
  purchasedBy?: {
    id: string;
    name: string;
    at: string;
  };
  createdAt: string;
}

export default function ApprovedPurchasePage() {
  const [requisitions, setRequisitions] = useState<Purchase[]>([]);
  const [approvedPurchases, setApprovedPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      // Fetch requisitions pending approval
      const reqResponse = await adminApi.get("/purchases?status=requisition");
      if (reqResponse.data.success) {
        setRequisitions(reqResponse.data.purchases);
      }

      // Fetch approved purchases ready for ordering
      const approvedResponse = await adminApi.get("/purchases?status=approved");
      if (approvedResponse.data.success) {
        setApprovedPurchases(approvedResponse.data.purchases);
      }
    } catch (error) {
      console.error("Error fetching purchases:", error);
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setNotes("");
    setShowApproveDialog(true);
  };

  const handleView = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setShowDetailsSheet(true);
  };

  const handleMarkPurchased = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setNotes("");
    setShowPurchaseDialog(true);
  };

  const confirmApprove = async () => {
    if (!selectedPurchase) return;

    try {
      setProcessing(true);
      const response = await adminApi.put(
        `/purchases/${selectedPurchase._id}/status`,
        {
          status: "approved",
          notes: notes.trim() || "Approved",
        }
      );

      if (response.data.success) {
        toast.success("Purchase requisition approved successfully");
        setShowApproveDialog(false);
        setSelectedPurchase(null);
        setNotes("");
        fetchPurchases();
      }
    } catch (error) {
      console.error("Error approving purchase:", error);
      toast.error("Failed to approve purchase");
    } finally {
      setProcessing(false);
    }
  };

  const confirmPurchased = async () => {
    if (!selectedPurchase) return;

    try {
      setProcessing(true);
      const response = await adminApi.put(
        `/purchases/${selectedPurchase._id}/status`,
        {
          status: "purchased",
          notes: notes.trim() || "Items purchased",
        }
      );

      if (response.data.success) {
        toast.success("Marked as purchased successfully");
        setShowPurchaseDialog(false);
        setSelectedPurchase(null);
        setNotes("");
        fetchPurchases();
      }
    } catch (error) {
      console.error("Error updating purchase:", error);
      toast.error("Failed to update purchase");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      requisition: "secondary",
      approved: "default",
      purchased: "outline",
      received: "default",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Approved Purchases
          </h1>
          <p className="text-muted-foreground mt-1">
            Approve requisitions and manage purchase orders
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchPurchases}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Pending Approval Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-orange-500" />
            Pending Approval ({requisitions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading requisitions...
            </div>
          ) : requisitions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No requisitions pending approval.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requisitions.map((requisition) => {
                  const totalSellingPrice = requisition.items.reduce(
                    (sum, item) => sum + item.sellingPrice * item.quantity,
                    0
                  );
                  return (
                    <TableRow key={requisition._id}>
                      <TableCell className="font-medium">
                        {requisition.purchaseNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {requisition.supplier.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {requisition.supplier.contact}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{requisition.items.length} items</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(requisition.totalAmount)}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(totalSellingPrice)}
                      </TableCell>
                      <TableCell>{requisition.createdBy.name}</TableCell>
                      <TableCell>{formatDate(requisition.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(requisition)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(requisition)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approved Purchases Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-green-500" />
            Approved for Purchase ({approvedPurchases.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading purchases...
            </div>
          ) : approvedPurchases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No approved purchases ready for ordering.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedPurchases.map((purchase) => {
                  const totalSellingPrice = purchase.items.reduce(
                    (sum, item) => sum + item.sellingPrice * item.quantity,
                    0
                  );
                  return (
                    <TableRow key={purchase._id}>
                      <TableCell className="font-medium">
                        {purchase.purchaseNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {purchase.supplier.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {purchase.supplier.contact}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{purchase.items.length} items</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(purchase.totalAmount)}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(totalSellingPrice)}
                      </TableCell>
                      <TableCell>
                        {purchase.approvedBy?.name || "N/A"}
                        {purchase.approvedBy?.at && (
                          <div className="text-xs text-muted-foreground">
                            {formatDate(purchase.approvedBy.at)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(purchase)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMarkPurchased(purchase)}
                          >
                            <Package className="w-4 h-4 mr-1" />
                            Mark Purchased
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Purchase Requisition</DialogTitle>
            <DialogDescription>
              Approve {selectedPurchase?.purchaseNumber} from{" "}
              {selectedPurchase?.supplier.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Items: {selectedPurchase?.items.length}</Label>
              <div className="text-sm text-muted-foreground">
                Total Amount:{" "}
                <span className="font-semibold">
                  {formatCurrency(selectedPurchase?.totalAmount || 0)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="approve-notes">Notes (Optional)</Label>
              <Textarea
                id="approve-notes"
                placeholder="Add approval notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={confirmApprove} disabled={processing}>
              {processing ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Purchased Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Purchased</DialogTitle>
            <DialogDescription>
              Confirm that {selectedPurchase?.purchaseNumber} has been purchased
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Supplier: {selectedPurchase?.supplier.name}</Label>
              <div className="text-sm text-muted-foreground">
                Total Amount:{" "}
                <span className="font-semibold">
                  {formatCurrency(selectedPurchase?.totalAmount || 0)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase-notes">Notes (Optional)</Label>
              <Textarea
                id="purchase-notes"
                placeholder="Add purchase details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPurchaseDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={confirmPurchased} disabled={processing}>
              {processing ? "Processing..." : "Mark as Purchased"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Details Sheet */}
      <PurchaseDetailsSheet
        open={showDetailsSheet}
        onClose={() => setShowDetailsSheet(false)}
        purchase={selectedPurchase}
      />
    </div>
  );
}
