import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Trash2, Clock, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { adminApi } from "@/lib/config";
import { formatCurrency, formatDate } from "@/lib/utils";
import CreateRequisitionSheet from "@/components/purchases/CreateRequisitionSheet";
import PurchaseDetailsSheet from "@/components/purchases/PurchaseDetailsSheet";

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
  items: PurchaseItem[];
  totalAmount: number;
  supplier: {
    name: string;
    contact: string;
  };
  status: string;
  notes?: string;
  createdBy: {
    name: string;
  };
  createdAt: string;
}

export default function CreatePurchasePage() {
  const [showRequisitionSheet, setShowRequisitionSheet] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );
  const [requisitions, setRequisitions] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const fetchRequisitions = async () => {
    try {
      setLoading(true);
      const response = await adminApi.get("/purchases?status=requisition");
      if (response.data.success) {
        setRequisitions(response.data.purchases);
      }
    } catch (error) {
      console.error("Error fetching requisitions:", error);
      toast.error("Failed to load requisitions");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setShowDetailsSheet(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this requisition?")) return;

    try {
      const response = await adminApi.delete(`/purchases/${id}`);
      if (response.data.success) {
        toast.success("Requisition deleted successfully");
        fetchRequisitions();
      }
    } catch (error) {
      console.error("Error deleting requisition:", error);
      toast.error("Failed to delete requisition");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create Purchase Requisition
          </h1>
          <p className="text-muted-foreground mt-1">
            Create new purchase requisitions for products
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchRequisitions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setShowRequisitionSheet(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Requisition
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Requisition List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading requisitions...
            </div>
          ) : requisitions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No requisitions found. Click "New Requisition" to create one.
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
                  <TableHead>Status</TableHead>
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
                      <TableCell>
                        <Badge variant="secondary">{requisition.status}</Badge>
                      </TableCell>
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
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(requisition._id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
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

      {/* Create Requisition Sheet */}
      <CreateRequisitionSheet
        open={showRequisitionSheet}
        onClose={() => setShowRequisitionSheet(false)}
        onSuccess={fetchRequisitions}
      />

      {/* Purchase Details Sheet */}
      <PurchaseDetailsSheet
        open={showDetailsSheet}
        onClose={() => setShowDetailsSheet(false)}
        purchase={selectedPurchase}
      />
    </div>
  );
}
