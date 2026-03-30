"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Cookies from "js-cookie";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  PackageX,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  X as XIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiSelect } from "@/components/ui/multi-select";

interface Product {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  aboutItems?: string[];
  price: number;
  purchasePrice?: number;
  profitMargin?: number;
  discountPercentage?: number;
  stock: number;
  sold?: number;
  image: string;
  images?: string[];
  productType?: string;
  category: {
    _id: string;
    name: string;
  };
  brand: {
    _id: string;
    name: string;
  };
  approvalStatus: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface Category {
  _id: string;
  name: string;
}

interface Brand {
  _id: string;
  name: string;
}

interface ProductFormData {
  name: string;
  description: string;
  aboutItems: string;
  price: string;
  purchasePrice: string;
  profitMargin: string;
  discountPercentage: string;
  stock: string;
  category: string;
  brand: string;
  productType: string[];
  slug: string;
}

interface ProductType {
  _id: string;
  name: string;
  type: string;
  isActive: boolean;
  displayOrder: number;
  color?: string;
}

export default function SellerProductsPage() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams?.get("status");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>(
    statusFilter || "all",
  );
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    slug: "",
    description: "",
    aboutItems: "",
    price: "",
    purchasePrice: "",
    profitMargin: "",
    discountPercentage: "0",
    stock: "",
    category: "",
    brand: "",
    productType: [],
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
    fetchProductTypes();
  }, [filterStatus]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/categories`,
      );
      if (response.ok) {
        const data = await response.json();
        // Handle different response formats
        const categoriesData = Array.isArray(data)
          ? data
          : data.categories || data.data || [];
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setCategories([]);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/brands`,
      );
      if (response.ok) {
        const data = await response.json();
        // Handle different response formats
        const brandsData = Array.isArray(data)
          ? data
          : data.brands || data.data || [];
        setBrands(brandsData);
      }
    } catch (error) {
      console.error("Failed to fetch brands:", error);
      setBrands([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = Cookies.get("auth_token");
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/sellers/products`;

      if (filterStatus && filterStatus !== "all") {
        url += `?status=${filterStatus}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || data);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductTypes = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/product-types`,
      );
      if (response.ok) {
        const types = await response.json();
        const sortedTypes = types.sort(
          (a: ProductType, b: ProductType) => a.displayOrder - b.displayOrder,
        );
        setProductTypes(sortedTypes);
      }
    } catch (error) {
      console.error("Failed to fetch product types:", error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError("");
    const files = Array.from(e.target.files || []);
    if (imagePreview.length + files.length > 5) {
      toast.error("Upload Limit Exceeded", {
        description: "You can only upload up to 5 images per product.",
        duration: 3000,
      });
      return;
    }

    setImages([...images, ...files]);

    // Create preview URLs
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreview([...imagePreview, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImageError("");
    const previewToRemove = imagePreview[index];

    // If it's a blob URL, it corresponds to a newly added File in the 'images' array
    if (previewToRemove.startsWith("blob:")) {
      let blobCountBefore = 0;
      for (let i = 0; i < index; i++) {
        if (imagePreview[i].startsWith("blob:")) {
          blobCountBefore++;
        }
      }
      const newImages = [...images];
      newImages.splice(blobCountBefore, 1);
      setImages(newImages);
    }

    const newPreviews = [...imagePreview];
    newPreviews.splice(index, 1);
    setImagePreview(newPreviews);
  };

  const handleGenerateSlug = () => {
    if (!formData.name) {
      toast.error("Product name is required", {
        description: "Please enter a product name first to generate a slug.",
        duration: 3000,
      });
      return;
    }
    const generatedSlug = formData.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove non-word chars
      .replace(/[\s_-]+/g, "-") // Replace spaces and separators with single hyphen
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

    setFormData({ ...formData, slug: generatedSlug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEditing = !!editingProduct;

    // For new products, require at least one new image
    // For editing, images are optional if product already has images
    if (!isEditing && images.length === 0 && imagePreview.length === 0) {
      setImageError("Please upload at least one product image");
      return;
    }

    setUploading(true);

    try {
      const token = Cookies.get("auth_token");

      // Upload new images if any
      const uploadedImages: string[] = [];
      for (const image of images) {
        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(image);
        });

        const base64Image = await base64Promise;

        const uploadResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/upload`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              image: base64Image,
              folder: "seller/products",
              originalName: image.name,
            }),
          },
        );

        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json();
          uploadedImages.push(url);
        } else {
          throw new Error("Failed to upload image");
        }
      }

      // Combine existing images (URLs that are not generated blobs) with newly uploaded ones
      const existingImages = imagePreview.filter(
        (img) => !img.startsWith("blob:"),
      );
      const allImages = [...existingImages, ...uploadedImages];

      // Create/Update product with images
      const productData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        aboutItems: formData.aboutItems
          ? formData.aboutItems.split("\n").filter((item) => item.trim() !== "")
          : [],
        price: parseFloat(formData.price),
        purchasePrice: formData.purchasePrice
          ? parseFloat(formData.purchasePrice)
          : 0,
        profitMargin: formData.profitMargin
          ? parseFloat(formData.profitMargin)
          : 0,
        discountPercentage: formData.discountPercentage
          ? parseFloat(formData.discountPercentage)
          : 0,
        stock: parseInt(formData.stock),
        category: formData.category,
        brand: formData.brand,
        productType: formData.productType,
        image: allImages[0],
        images: allImages,
        ...(isEditing ? {} : { approvalStatus: "pending" }),
      };

      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/sellers/products/${editingProduct._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/sellers/products`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        // Reset form
        setFormData({
          name: "",
          slug: "",
          description: "",
          aboutItems: "",
          price: "",
          purchasePrice: "",
          profitMargin: "",
          discountPercentage: "0",
          stock: "",
          category: "",
          brand: "",
          productType: [],
        });
        setImages([]);
        setImagePreview([]);
        setIsAddProductOpen(false);
        setIsEditProductOpen(false);
        setEditingProduct(null);

        if (
          !isEditing &&
          filterStatus !== "all" &&
          filterStatus !== "pending"
        ) {
          setFilterStatus("all");
        } else {
          fetchProducts();
        }

        toast.success(
          isEditing
            ? "Product Updated Successfully!"
            : "Product Added Successfully!",
          {
            description: isEditing
              ? `${formData.name} has been updated.`
              : `${formData.name} has been submitted and is pending admin approval.`,
            duration: 4000,
          },
        );
      } else {
        const error = await response.json();
        toast.error(
          isEditing ? "Failed to Update Product" : "Failed to Add Product",
          {
            description: error.message || "Please try again later.",
            duration: 4000,
          },
        );
      }
    } catch (error) {
      console.error(
        `Failed to ${isEditing ? "update" : "create"} product:`,
        error,
      );
      toast.error(
        isEditing ? "Failed to Update Product" : "Failed to Add Product",
        {
          description: "An unexpected error occurred. Please try again.",
          duration: 4000,
        },
      );
    } finally {
      setUploading(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug || "",
      description: product.description || "",
      aboutItems: product.aboutItems ? product.aboutItems.join("\n") : "",
      price: product.price.toString(),
      purchasePrice: product.purchasePrice?.toString() || "",
      profitMargin: product.profitMargin?.toString() || "",
      discountPercentage: product.discountPercentage?.toString() || "0",
      stock: product.stock.toString(),
      category: product.category?._id || "",
      brand: product.brand?._id || "",
      productType: Array.isArray(product.productType)
        ? product.productType.map((pt: any) => pt?._id || pt)
        : product.productType
          ? [
              typeof product.productType === "object"
                ? (product.productType as any)._id
                : product.productType,
            ]
          : [],
    });
    // Set existing images
    if (product.images && product.images.length > 0) {
      setImagePreview(product.images);
    } else if (product.image) {
      setImagePreview([product.image]);
    }
    setImages([]);
    setIsEditProductOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      setDeleting(true);
      const token = Cookies.get("auth_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sellers/products/${productToDelete._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        toast.success("Product Deleted", {
          description: `${productToDelete.name} has been deleted successfully.`,
          duration: 3000,
        });
        fetchProducts();
        setDeleteModalOpen(false);
        setProductToDelete(null);
      } else {
        const error = await response.json();
        toast.error("Failed to Delete Product", {
          description: error.message || "Please try again later.",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error("Failed to Delete Product", {
        description: "An unexpected error occurred. Please try again.",
        duration: 4000,
      });
    } finally {
      setDeleting(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-primary/10 text-primary border-primary/20",
      rejected: "bg-accent/10 text-accent border-accent/20",
    };

    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
    };

    const StatusIcon = icons[status as keyof typeof icons];

    return (
      <Badge
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 shadow-none font-medium ${
          styles[status as keyof typeof styles]
        }`}
        variant="outline"
      >
        <StatusIcon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-primary-foreground rounded animate-pulse"></div>
        <div className="h-64 bg-primary-foreground rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section with gradient flair */}
      <div className="relative overflow-hidden bg-white p-6 md:p-8 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group">
        <div className="absolute right-0 top-0 w-64 h-full bg-linear-to-l from-primary/5 to-transparent pointer-events-none transition-opacity opacity-0 group-hover:opacity-100 duration-500"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
              <PackageX className="w-6 h-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              My Products
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
            Manage your product catalog, track inventory, and add new items to
            your store.
          </p>
        </div>
        <div className="relative z-10 shrink-0">
          <button
            onClick={() => setIsAddProductOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-background px-5 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md font-medium"
          >
            <Plus className="h-5 w-5" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-border/60 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9"
            />
          </div>
          <div className="w-full sm:w-[400px]">
            <Tabs
              value={filterStatus}
              onValueChange={setFilterStatus}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="border border-border/60 rounded-xl bg-white shadow-xs overflow-hidden flex flex-col">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center bg-gray-50/40">
            <PackageX className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground/90 mb-2">
              No products found
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Start by adding your first product"}
            </p>
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-background px-6 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md font-medium"
            >
              <Plus className="h-5 w-5" />
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20 border-b-border/40">
                  <TableHead className="py-4 font-semibold text-muted-foreground/80">
                    Product Details
                  </TableHead>
                  <TableHead className="py-4 font-semibold text-muted-foreground/80">
                    Category
                  </TableHead>
                  <TableHead className="py-4 font-semibold text-muted-foreground/80">
                    Price
                  </TableHead>
                  <TableHead className="py-4 font-semibold text-muted-foreground/80">
                    Stock
                  </TableHead>
                  <TableHead className="py-4 font-semibold text-muted-foreground/80">
                    Sold
                  </TableHead>
                  <TableHead className="py-4 font-semibold text-muted-foreground/80">
                    Status
                  </TableHead>
                  <TableHead className="py-4 font-semibold text-muted-foreground/80 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow
                    key={product._id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <TableCell className="py-4 align-middle">
                      <div className="flex items-center gap-4">
                        <div className="relative h-11 w-11 shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-border shadow-xs">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-semibold text-foreground/90 block">
                            {product.name}
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground/80 truncate max-w-[150px] inline-block mt-0.5">
                            {product.brand?.name}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 align-middle">
                      <span className="text-sm font-medium text-foreground/80">
                        {product.category?.name}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 align-middle">
                      <span className="text-sm font-medium text-foreground/90">
                        ${product.price.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 align-middle">
                      <span className="text-sm text-muted-foreground font-medium">
                        {product.stock} unit(s)
                      </span>
                    </TableCell>
                    <TableCell className="py-4 align-middle">
                      <span className="text-sm text-muted-foreground font-medium">
                        {product.sold || 0} unit(s)
                      </span>
                    </TableCell>
                    <TableCell className="py-4 align-middle">
                      {getStatusBadge(product.approvalStatus)}
                    </TableCell>
                    <TableCell className="py-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/product/${product.slug || product._id}`}
                          target="_blank"
                          className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/10"
                          title="View Product"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => {
                            if (product.approvalStatus !== "pending") {
                              handleEditClick(product);
                            }
                          }}
                          disabled={product.approvalStatus === "pending"}
                          className={`p-2 rounded-lg transition-colors border border-transparent ${
                            product.approvalStatus === "pending"
                              ? "text-muted-foreground/40 cursor-not-allowed"
                              : "text-muted-foreground hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100"
                          }`}
                          title={
                            product.approvalStatus === "pending"
                              ? "Cannot edit pending product"
                              : "Edit Product"
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {product.approvalStatus === "pending" && (
                          <button
                            onClick={() => handleDeleteClick(product)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit Product Sheet */}
      <Sheet open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
            <SheetHeader>
              <SheetTitle className="text-foreground text-xl">
                Edit Product
              </SheetTitle>
              <SheetDescription className="text-muted-foreground">
                Update your product details. Changes will be saved immediately.
              </SheetDescription>
            </SheetHeader>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Product Images */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Product Images (Max 5) *
              </label>
              {imageError && (
                <p className="text-sm text-destructive mb-2">{imageError}</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {imagePreview.map((preview, index) => (
                  <div key={index} className="relative aspect-square">
                    <Image
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="rounded-xl object-cover border border-border shrink-0 shadow-sm bg-muted/20"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-background text-destructive border border-border shadow-sm rounded-full p-1.5 hover:bg-destructive hover:text-white transition-colors z-10"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {imagePreview.length < 5 && (
                  <label className="relative aspect-square border-2 border-dashed border-border/80 rounded-xl hover:border-primary cursor-pointer flex flex-col items-center justify-center bg-muted/40 hover:bg-muted/80 transition-colors group p-4 text-center">
                    <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                      Upload Image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Product Name & Slug */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block mb-2">Product Name *</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <Label className="block mb-2">Slug</Label>
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    placeholder="auto-generated-if-empty"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateSlug}
                    className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>

            {/* Description & About Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block mb-2">Description *</Label>
                <Textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  placeholder="Enter product description"
                />
              </div>
              <div>
                <Label className="block mb-2">About Items (One per line)</Label>
                <Textarea
                  value={formData.aboutItems}
                  onChange={(e) =>
                    setFormData({ ...formData, aboutItems: e.target.value })
                  }
                  rows={4}
                  placeholder="Key feature 1&#10;Key feature 2"
                />
              </div>
            </div>

            {/* Category & Brand */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="block mb-2">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="block mb-2">Brand *</Label>
                <Select
                  value={formData.brand}
                  onValueChange={(value) =>
                    setFormData({ ...formData, brand: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand._id} value={brand._id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="block mb-2">Selling Price *</Label>
                <Input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label className="block mb-2">Purchase Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.purchasePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, purchasePrice: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label className="block mb-2">Profit Margin (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.profitMargin}
                  onChange={(e) =>
                    setFormData({ ...formData, profitMargin: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            {/* Stock, Discount & Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="block mb-2">Stock Quantity *</Label>
                <Input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="block mb-2">Discount (%)</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountPercentage: e.target.value,
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="block mb-2">Product Type *</Label>
                <MultiSelect
                  options={productTypes.map((type) => ({
                    label: type.name,
                    value: type._id,
                    color: type.color,
                  }))}
                  onValueChange={(value) =>
                    setFormData({ ...formData, productType: value })
                  }
                  value={formData.productType}
                  placeholder="Select Product Type"
                  disabled={uploading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-background -mx-6 px-6 pb-6 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsEditProductOpen(false);
                  setEditingProduct(null);
                  setFormData({
                    name: "",
                    slug: "",
                    description: "",
                    aboutItems: "",
                    price: "",
                    purchasePrice: "",
                    profitMargin: "",
                    discountPercentage: "0",
                    stock: "",
                    category: "",
                    brand: "",
                    productType: [],
                  });
                  setImages([]);
                  setImagePreview([]);
                }}
                disabled={uploading}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-foreground rounded-lg hover:bg-primary-foreground transition-colors disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 px-4 py-2.5 bg-primary text-background rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 shadow-sm hover:shadow-md font-medium"
              >
                {uploading ? "Updating..." : "Update Product"}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Add Product Sheet */}
      <Sheet open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
            <SheetHeader>
              <SheetTitle className="text-foreground text-xl">
                Add New Product
              </SheetTitle>
              <SheetDescription className="text-muted-foreground">
                Add a new product to your store. All products require admin
                approval before going live.
              </SheetDescription>
            </SheetHeader>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Product Images */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Product Images (Max 5) *
              </label>
              {imageError && (
                <p className="text-sm text-destructive mb-2">{imageError}</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {imagePreview.map((preview, index) => (
                  <div key={index} className="relative aspect-square">
                    <Image
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="rounded-xl object-cover border border-border shrink-0 shadow-sm bg-muted/20"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-background text-destructive border border-border shadow-sm rounded-full p-1.5 hover:bg-destructive hover:text-white transition-colors z-10"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {imagePreview.length < 5 && (
                  <label className="relative aspect-square border-2 border-dashed border-border/80 rounded-xl hover:border-primary cursor-pointer flex flex-col items-center justify-center bg-muted/40 hover:bg-muted/80 transition-colors group p-4 text-center">
                    <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                      Upload Image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Product Name & Slug */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block mb-2">Product Name *</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <Label className="block mb-2">Slug</Label>
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    placeholder="auto-generated-if-empty"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateSlug}
                    className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>

            {/* Description & About Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block mb-2">Description *</Label>
                <Textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  placeholder="Enter product description"
                />
              </div>
              <div>
                <Label className="block mb-2">About Items (One per line)</Label>
                <Textarea
                  value={formData.aboutItems}
                  onChange={(e) =>
                    setFormData({ ...formData, aboutItems: e.target.value })
                  }
                  rows={4}
                  placeholder="Key feature 1&#10;Key feature 2"
                />
              </div>
            </div>

            {/* Category & Brand */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="block mb-2">Category *</Label>
                <Select
                  value={formData.category} // fixed empty value mapping later manually if bug
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="block mb-2">Brand *</Label>
                <Select
                  value={formData.brand}
                  onValueChange={(value) =>
                    setFormData({ ...formData, brand: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand._id} value={brand._id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="block mb-2">Selling Price *</Label>
                <Input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label className="block mb-2">Purchase Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.purchasePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, purchasePrice: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label className="block mb-2">Profit Margin (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.profitMargin}
                  onChange={(e) =>
                    setFormData({ ...formData, profitMargin: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            {/* Stock, Discount & Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="block mb-2">Stock Quantity *</Label>
                <Input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="block mb-2">Discount (%)</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountPercentage: e.target.value,
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="block mb-2">Product Type *</Label>
                <MultiSelect
                  options={productTypes.map((type) => ({
                    label: type.name,
                    value: type._id,
                    color: type.color,
                  }))}
                  onValueChange={(value) =>
                    setFormData({ ...formData, productType: value })
                  }
                  value={formData.productType}
                  placeholder="Select Product Type"
                  disabled={uploading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-background -mx-6 px-6 pb-6 mt-6">
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                disabled={uploading}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-foreground rounded-lg hover:bg-primary-foreground transition-colors disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 px-4 py-2.5 bg-primary text-background rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 shadow-sm hover:shadow-md font-medium"
              >
                {uploading ? "Creating..." : "Create Product"}
              </button>
            </div>

            {/* Info Message */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mx-0">
              <p className="text-sm text-primary">
                <strong>Note:</strong> Your product will be submitted for admin
                approval. Once approved, it will be visible to customers in the
                store.
              </p>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              Delete Product
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {productToDelete && (
                <>
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-foreground">
                    {productToDelete.name}
                  </span>
                  ? This action cannot be undone and will permanently remove the
                  product from your store.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <XCircle className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Product
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
