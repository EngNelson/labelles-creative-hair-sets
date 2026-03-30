"use client";

import { useCompareStore } from "@/lib/useCompareStore";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import PriceContainer from "@/components/common/PriceContainer";
import ProductRating from "@/components/common/products/ProductRating";
import { getProductUrl } from "@/lib/productHelpers";
import CompareSearch from "./CompareSearch";
import { useState, useEffect } from "react";
import { Product } from "@entry/types";
import { fetchData } from "@/lib/api";
import ProductCard from "@/components/common/products/ProductCard";
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

// Title labels for the left column
const COMPARE_ATTRIBUTES = [
  { id: "product", label: "Product" },
  { id: "price", label: "Price" },
  { id: "rating", label: "Rating" },
  { id: "category", label: "Category" },
  { id: "brand", label: "Brand" },
  { id: "stock", label: "Availability" },
  { id: "sold", label: "Sold" },
  { id: "viewCount", label: "Views" },
  { id: "about", label: "About Item" },
  { id: "description", label: "Description" },
];

export default function ComparePage() {
  const { compareItems, removeFromCompare, clearCompare } = useCompareStore();
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Fetch some generic/related products to show at the bottom
    const fetchRelated = async () => {
      try {
        const res = (await fetchData("/products?limit=4")) as any;
        if (res?.data?.products) {
          setRelatedProducts(res.data.products);
        } else if (res?.products) {
          setRelatedProducts(res.products);
        }
      } catch (err) {
        console.error("Failed to load related products", err);
      }
    };
    fetchRelated();
  }, []);

  const confirmClear = () => {
    clearCompare();
    setShowClearDialog(false);
  };

  if (compareItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
        <h1 className="text-3xl font-bold mb-4 text-foreground">
          Compare Products
        </h1>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Add up to 4 products to compare their features, prices, and ratings
          side by side to make the best purchasing decision.
        </p>

        <div className="max-w-md mx-auto relative">
          <CompareSearch />
        </div>
      </div>
    );
  }

  // Ensure 4 columns total. If less than 4 items, we pad with empty columns
  const columns = [...compareItems];
  while (columns.length < 4) {
    // @ts-ignore - we'll handle the empty spaces in render
    columns.push(null);
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Compare Products
          </h1>
          <p className="text-muted-foreground mt-1">
            {compareItems.length} / 4 Products added
          </p>
        </div>
        <button
          onClick={() => setShowClearDialog(true)}
          className="text-sm font-medium text-destructive hover:underline"
        >
          Clear All
        </button>
      </div>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent onEscapeKeyDown={() => setShowClearDialog(false)}>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Comparison</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove all products from the compare
              list? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClear}
              className="bg-destructive !text-white hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="bg-card border border-border rounded-lg overflow-x-auto shadow-sm">
        <div className="min-w-[1000px] divide-y divide-border">
          {COMPARE_ATTRIBUTES.map((attr, idx) => (
            <div key={attr.id} className="flex">
              {/* Left Title Column */}
              <div className="w-[15%] p-4 min-w-[150px] bg-accent/20 font-semibold text-sm text-foreground flex items-center border-r border-border">
                {attr.label}
              </div>

              {/* Product Columns */}
              {columns.map((product, colIdx) => (
                <div
                  key={colIdx}
                  className="w-[21.25%] flex-1 p-4 border-r border-border last:border-r-0 relative"
                >
                  {!product ? (
                    // Empty column placeholder with search
                    <div className="h-full flex flex-col items-center justify-center p-4">
                      {attr.id === "product" && (
                        <div className="w-full">
                          <p className="text-sm text-muted-foreground text-center mb-3">
                            Add a product
                          </p>
                          <CompareSearch placeholder="Search..." />
                        </div>
                      )}
                    </div>
                  ) : (
                    // Populated column
                    <div className="h-full">
                      {attr.id === "product" && (
                        <div className="relative group">
                          <button
                            onClick={() => removeFromCompare(product._id)}
                            className="absolute -top-2 -right-2 bg-background border border-border text-muted-foreground hover:text-destructive w-7 h-7 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            title="Remove from compare"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          <Link href={getProductUrl(product)} className="block">
                            <div className="bg-white rounded-md p-2 border border-border mb-3 h-[180px] flex items-center justify-center">
                              <Image
                                src={
                                  product.images?.[0] ||
                                  product.image ||
                                  "/images/placeholder.png"
                                }
                                alt={product.name}
                                width={200}
                                height={200}
                                className="max-h-full object-contain"
                              />
                            </div>
                            <h3 className="font-semibold text-base line-clamp-2 hover:text-accent transition-colors">
                              {product.name}
                            </h3>
                          </Link>
                        </div>
                      )}

                      {attr.id === "price" && (
                        <PriceContainer
                          price={product.price}
                          discountPercentage={product.discountPercentage}
                        />
                      )}

                      {attr.id === "rating" && (
                        <div className="flex items-center gap-2">
                          <ProductRating
                            rating={
                              product.averageRating || product.rating || 0
                            }
                            numReviews={product.numReviews}
                          />
                        </div>
                      )}

                      {attr.id === "category" && (
                        <span className="text-sm text-muted-foreground">
                          {typeof product.category === "object"
                            ? product.category.name
                            : "Unknown"}
                        </span>
                      )}

                      {attr.id === "brand" && (
                        <span className="text-sm text-muted-foreground">
                          {typeof product.brand === "object"
                            ? product.brand.name
                            : product.brand || "No Brand"}
                        </span>
                      )}

                      {attr.id === "stock" && (
                        <span
                          className={`text-sm font-medium ${
                            (product.stock || 0) > 0
                              ? "text-green-600"
                              : "text-destructive"
                          }`}
                        >
                          {(product.stock || 0) > 0
                            ? `In Stock (${product.stock})`
                            : "Out of Stock"}
                        </span>
                      )}

                      {attr.id === "sold" && (
                        <span className="text-sm text-muted-foreground">
                          {product.sold || 0} unit(s)
                        </span>
                      )}

                      {attr.id === "viewCount" && (
                        <span className="text-sm text-muted-foreground">
                          {product.viewCount ||
                            (product.views && product.views.length) ||
                            0}{" "}
                          view(s)
                        </span>
                      )}

                      {attr.id === "about" && (
                        <div className="text-sm text-muted-foreground">
                          {product.aboutItems &&
                          product.aboutItems.length > 0 ? (
                            <ul className="list-disc pl-4 space-y-1">
                              {product.aboutItems.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            "N/A"
                          )}
                        </div>
                      )}

                      {attr.id === "description" && (
                        <div className="text-sm text-muted-foreground line-clamp-4 prose prose-sm dark:prose-invert">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: product.description,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            You might also like
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
