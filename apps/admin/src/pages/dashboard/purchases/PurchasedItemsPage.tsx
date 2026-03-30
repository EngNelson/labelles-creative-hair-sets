import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PackageCheck,
  Eye,
  Trash2,
  CheckCircle,
  AlertCircle,
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
    id?: string;
    name: string;
  };
  approvedBy?: {
    id?: string;
    name: string;
    at: string;
  };
  purchasedBy?: {
    id?: string;
    name: string;
    at: string;
  };
  receivedBy?: {
    id?: string;
    name: string;
    at: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export default function PurchasedItemsPage() {
  const [purchasedItems, setPurchasedItems] = useState<Purchase[]>([]);
  const [receivedItems, setReceivedItems] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      // Fetch purchased items
      const purchasedResponse = await adminApi.get(
        "/purchases?status=purchased"
      );
      if (purchasedResponse.data.success) {
        setPurchasedItems(purchasedResponse.data.purchases);
      }

      // Fetch received items
      const receivedResponse = await adminApi.get("/purchases?status=received");
      if (receivedResponse.data.success) {
        setReceivedItems(receivedResponse.data.purchases);
      }
    } catch (error) {
      console.error("Error fetching purchases:", error);
      toast.error("Failed to load purchased items");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setShowDetailsSheet(true);
  };

  const handleMarkReceived = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setNotes("");
    setShowReceiveDialog(true);
  };

  const confirmReceived = async () => {
    if (!selectedPurchase) return;

    try {
      setProcessing(true);
      const response = await adminApi.put(
        `/purchases/${selectedPurchase._id}/status`,
        {
          status: "received",
          notes: notes.trim() || "Items received and stock updated",
        }
      );

      if (response.data.success) {
        toast.success(
          "Marked as received! Product stock and prices have been updated."
        );
        setShowReceiveDialog(false);
        setSelectedPurchase(null);
        setNotes("");
        fetchPurchases();
      }
    } catch (error) {
      console.error("Error updating purchase:", error);
      toast.error("Failed to mark as received");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteClick = (purchaseId: string) => {
    setPurchaseToDelete(purchaseId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!purchaseToDelete) return;

    try {
      setProcessing(true);
      const response = await adminApi.delete(`/purchases/${purchaseToDelete}`);
      if (response.data.success) {
        toast.success("Purchase deleted successfully");
        setShowDeleteDialog(false);
        setPurchaseToDelete(null);
        fetchPurchases();
      }
    } catch (error) {
      console.error("Error deleting purchase:", error);
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "message" in error.response.data
          ? String(error.response.data.message)
          : "Failed to delete purchase";
      toast.error(message);
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
          <h1 className="text-3xl font-bold tracking-tight">Purchased Items</h1>
          <p className="text-muted-foreground mt-1">
            Track purchased orders and manage stock receiving
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

      {/* Purchased Items - Pending Receipt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-blue-500" />
            Purchased - Pending Receipt ({purchasedItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading purchased items...
            </div>
          ) : purchasedItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No purchased items pending receipt.
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
                  <TableHead>Purchased By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchasedItems.map((purchase) => {
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
                        {purchase.purchasedBy?.name || "N/A"}
                        {purchase.purchasedBy?.at && (
                          <div className="text-xs text-muted-foreground">
                            {formatDate(purchase.purchasedBy.at)}
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
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(purchase._id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMarkReceived(purchase)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark Received
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

      {/* Received Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Received - Stock Updated ({receivedItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading received items...
            </div>
          ) : receivedItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No received items yet.
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
                  <TableHead>Received By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivedItems.map((purchase) => {
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
                        {purchase.receivedBy?.name || "N/A"}
                        {purchase.receivedBy?.at && (
                          <div className="text-xs text-muted-foreground">
                            {formatDate(purchase.receivedBy.at)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(purchase)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Mark Received Dialog */}
      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Received</DialogTitle>
            <DialogDescription>
              Confirm that {selectedPurchase?.purchaseNumber} has been received.
              This will update product stock and prices.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">This action will:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      Increase product stock by purchased quantities (
                      {selectedPurchase?.items.length} items)
                    </li>
                    <li>Update product prices to new selling prices</li>
                    <li>Update purchase price and profit margins</li>
                  </ul>
                </div>
              </div>
            </div>
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
              <Label htmlFor="receive-notes">Notes (Optional)</Label>
              <Textarea
                id="receive-notes"
                placeholder="Add receipt notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReceiveDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={confirmReceived} disabled={processing}>
              {processing ? "Processing..." : "Confirm Receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this purchase? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={processing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {processing ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Purchase Details Sheet */}
      <PurchaseDetailsSheet
        open={showDetailsSheet}
        onClose={() => setShowDetailsSheet(false)}
        purchase={selectedPurchase}
      />
    </div>
  );
}
