import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  FileText,
  Download,
  Share2,
  Eye,
  Package,
  Printer,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import api from "@/lib/api";
import InvoiceTemplate from "@/components/invoice/InvoiceTemplate";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";

interface OrderItem {
  product: {
    _id: string;
    name: string;
    price: number;
    image?: string;
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderId: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  totalAmount: number;
  status: string;
  paymentStatus: "paid" | "pending" | "failed";
  createdAt: string;
  updatedAt: string;
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  notes: string;
  terms: string;
  order: Order;
}

const InvoicePage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [perPage] = useState(100);

  const axiosPrivate = useAxiosPrivate();

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${invoiceData?.invoiceNumber}`,
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosPrivate.get("/orders", {
        params: {
          perPage,
        },
      });

      // The backend returns { orders: [...], total, totalPages, currentPage }
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filterOrders = useCallback(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    filterOrders();
  }, [filterOrders]);

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `INV-${year}${month}${day}-${random}`;
  };

  const generateInvoice = (order: Order) => {
    const invoiceNumber = generateInvoiceNumber();
    const invoiceDate = new Date().toISOString().split("T")[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const invoice: InvoiceData = {
      invoiceNumber,
      invoiceDate,
      dueDate,
      notes: "Thank you for your business!",
      terms: "Payment due within 30 days.",
      order,
    };

    setInvoiceData(invoice);
  };

  const downloadPDF = () => {
    if (!invoiceData) return;

    // Create a new window for PDF generation
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice-${invoiceData.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .invoice { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .company-info h1 { color: #2563eb; margin: 0; }
            .invoice-info { text-align: right; }
            .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .party { flex: 1; }
            .party h3 { margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f8fafc; }
            .totals { margin-left: auto; width: 300px; }
            .total-row { font-weight: bold; font-size: 1.1em; }
            .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; }
            .status-paid { background-color: #dcfce7; color: #166534; }
            .status-pending { background-color: #fef3c7; color: #92400e; }
            .notes { margin-top: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <div class="company-info">
                <h1>Entry</h1>
                <p>123 Business St<br>City, State 12345<br>contact@entry.reactbd.com</p>
              </div>
              <div class="invoice-info">
                <h2>INVOICE</h2>
                <p><strong>Invoice #:</strong> ${invoiceData.invoiceNumber}</p>
                <p><strong>Date:</strong> ${new Date(
                  invoiceData.invoiceDate
                ).toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> ${new Date(
                  invoiceData.dueDate
                ).toLocaleDateString()}</p>
              </div>
            </div>

            <div class="parties">
              <div class="party">
                <h3>Bill To:</h3>
                <p><strong>${invoiceData.order.user.name}</strong><br>
                ${invoiceData.order.user.email}<br>
                ${invoiceData.order.shippingAddress.street}<br>
                ${invoiceData.order.shippingAddress.city}, ${
                  invoiceData.order.shippingAddress.zipCode
                }<br>
                ${invoiceData.order.shippingAddress.country}</p>
              </div>
              <div class="party">
                <h3>Order Details:</h3>
                <p><strong>Order ID:</strong> ${invoiceData.order._id}</p>
                <p><strong>Order Date:</strong> ${new Date(
                  invoiceData.order.createdAt
                ).toLocaleDateString()}</p>
                <p><strong>Payment Method:</strong> Credit Card</p>
                <p><strong>Status:</strong> 
                  <span class="status-badge ${
                    invoiceData.order.paymentStatus === "paid"
                      ? "status-paid"
                      : "status-pending"
                  }">
                    ${
                      invoiceData.order.paymentStatus === "paid"
                        ? "Paid"
                        : "Pending"
                    }
                  </span>
                </p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceData.order.items
                  .map(
                    (item: OrderItem) => `
                  <tr>
                    <td>${item.product.name}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td>$${(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>

            <table class="totals">
              <tr>
                <td>Subtotal:</td>
                <td>$${invoiceData.order.totalAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Tax:</td>
                <td>$0.00</td>
              </tr>
              <tr>
                <td>Shipping:</td>
                <td>$0.00</td>
              </tr>
              <tr class="total-row">
                <td>Total:</td>
                <td>$${invoiceData.order.totalAmount.toFixed(2)}</td>
              </tr>
            </table>

            <div class="notes">
              <h4>Notes:</h4>
              <p>${invoiceData.notes}</p>
              <h4>Terms:</h4>
              <p>${invoiceData.terms}</p>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const shareInvoice = (platform: string) => {
    if (!invoiceData) return;

    const shareText = `Invoice ${
      invoiceData.invoiceNumber
    } from Entry - Total: $${invoiceData.order.totalAmount.toFixed(2)}`;
    const shareUrl = window.location.href;

    switch (platform) {
      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(
            `${shareText} ${shareUrl}`
          )}`
        );
        break;
      case "telegram":
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(
            shareUrl
          )}&text=${encodeURIComponent(shareText)}`
        );
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            shareText
          )}&url=${encodeURIComponent(shareUrl)}`
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            shareUrl
          )}`
        );
        break;
      case "linkedin":
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            shareUrl
          )}`
        );
        break;
      case "copy":
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`).then(() => {
          toast({
            title: "Copied to clipboard",
            description: "Invoice details copied to clipboard",
          });
        });
        break;
      default:
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoice Generator</h1>
          <p className="text-muted-foreground">
            Generate and manage invoices for your orders
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by Order ID, Customer Name, or Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Orders ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">
                        {order._id.slice(-8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${order.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.paymentStatus === "paid"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            order.paymentStatus === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {order.paymentStatus === "paid" ? "Paid" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(order.status)}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => generateInvoice(order)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="h-4 w-4" />
                            Generate
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredOrders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No orders found matching your criteria
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Preview Dialog */}
      {invoiceData && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Preview</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handlePrint}
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadPDF}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button
                  onClick={() => setIsShareDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share Invoice
                </Button>
              </div>
              <div ref={invoiceRef}>
                <InvoiceTemplate invoiceData={invoiceData} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share this invoice via social media or copy the link
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => shareInvoice("whatsapp")}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={() => shareInvoice("telegram")}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Telegram
              </Button>
              <Button
                variant="outline"
                onClick={() => shareInvoice("twitter")}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => shareInvoice("facebook")}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={() => shareInvoice("linkedin")}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                onClick={() => shareInvoice("copy")}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setIsShareDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Actions */}
      {invoiceData && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                variant="outline"
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview Invoice
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print Invoice
              </Button>
              <Button
                variant="outline"
                onClick={downloadPDF}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button
                onClick={() => setIsShareDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InvoicePage;
