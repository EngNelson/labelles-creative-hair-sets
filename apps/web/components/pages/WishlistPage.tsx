"use client";
import React, { useEffect, useState, useCallback } from "react";
import Container from "@/components/common/Container";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import { Button } from "@/components/ui/button";
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
  Heart,
  ShoppingBag,
  Trash2,
  Grid3X3,
  List,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useUserStore, useWishlistStore } from "@/lib/store";
import { getProductUrl } from "@/lib/productHelpers";
import {
  getUserWishlist,
  getWishlistProducts,
  removeFromWishlist,
  clearWishlist,
} from "@/lib/wishlistApi";
import { Product } from "@entry/types";
import Image from "next/image";
import Link from "next/link";
import PriceFormatter from "@/components/common/PriceFormatter";
import AddToCartButton from "@/components/common/products/AddToCartButton";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";

const WishlistPage = () => {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [allWishlistIds, setAllWishlistIds] = useState<string[]>([]);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const router = useRouter();

  const { isAuthenticated, auth_token } = useUserStore();
  const {
    wishlistItems,
    setWishlistItems,
    setWishlistIds,
    removeFromWishlist: removeFromWishlistStore,
    clearWishlist: clearWishlistStore,
  } = useWishlistStore();

  const fetchWishlistData = useCallback(async () => {
    if (!auth_token) return;

    try {
      setLoading(true);
      setCurrentPage(1);

      // Get wishlist IDs from server
      const wishlistResponse = await getUserWishlist(auth_token);

      if (wishlistResponse.success && wishlistResponse.wishlist.length > 0) {
        setAllWishlistIds(wishlistResponse.wishlist);
        setWishlistIds(wishlistResponse.wishlist);

        // Fetch first page of product details
        const productsResponse = await getWishlistProducts(
          wishlistResponse.wishlist,
          auth_token,
          1,
          10
        );

        if (productsResponse.success) {
          setWishlistItems(productsResponse.products);
          setHasMore(productsResponse.pagination?.hasMore || false);
        }
      } else {
        setAllWishlistIds([]);
        setWishlistIds([]);
        setWishlistItems([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      toast.error("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }, [auth_token, setWishlistItems, setWishlistIds]);

  useEffect(() => {
    if (!isAuthenticated || !auth_token) {
      router.push("/auth/signin");
      return;
    }

    fetchWishlistData();
  }, [isAuthenticated, auth_token, router, fetchWishlistData]);

  const loadMoreProducts = useCallback(async () => {
    if (!auth_token || loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;

      const productsResponse = await getWishlistProducts(
        allWishlistIds,
        auth_token,
        nextPage,
        10
      );

      if (productsResponse.success) {
        const newProducts = [...wishlistItems, ...productsResponse.products];
        setWishlistItems(newProducts);
        setCurrentPage(nextPage);
        setHasMore(productsResponse.pagination?.hasMore || false);
      }
    } catch (error) {
      console.error("Error loading more products:", error);
      toast.error("Failed to load more products");
    } finally {
      setLoadingMore(false);
    }
  }, [
    auth_token,
    loadingMore,
    hasMore,
    currentPage,
    allWishlistIds,
    setWishlistItems,
    wishlistItems,
  ]);

  // Infinite scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 1000 &&
        !loadingMore &&
        hasMore
      ) {
        loadMoreProducts();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadingMore, hasMore, loadMoreProducts]);

  const handleRemoveItem = async (productId: string) => {
    if (!auth_token) return;

    try {
      setRemoving(productId);
      await removeFromWishlist(productId, auth_token);
      removeFromWishlistStore(productId);

      // Update local state
      setAllWishlistIds((prev) => prev.filter((id) => id !== productId));

      toast.success("Removed from wishlist");
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Failed to remove item");
    } finally {
      setRemoving(null);
    }
  };

  const handleClearWishlist = () => {
    setShowClearDialog(true);
  };

  const confirmClearWishlist = async () => {
    if (!auth_token) return;

    try {
      await clearWishlist(auth_token);
      clearWishlistStore();
      setAllWishlistIds([]);
      setHasMore(false);
      setCurrentPage(1);
      setShowClearDialog(false);
      toast.success("Wishlist cleared");
    } catch (error) {
      console.error("Error clearing wishlist:", error);
      toast.error("Failed to clear wishlist");
    }
  };

  const ProductCard = ({
    product,
    isListView = false,
  }: {
    product: Product;
    isListView?: boolean;
  }) => (
    <div
      className={cn(
        "border rounded-lg overflow-hidden group bg-white hover:shadow-md transition-all duration-300",
        isListView ? "flex gap-4 p-4" : "flex-col"
      )}
    >
      <Link
        href={getProductUrl(product)}
        className={cn("block", isListView ? "shrink-0" : "")}
      >
        <div
          className={cn("relative", isListView ? "w-32 h-32" : "w-full h-48")}
        >
          <Image
            src={product.images?.[0] || product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {(product.discountPercentage ?? 0) > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
              -{product.discountPercentage ?? 0}%
            </div>
          )}
        </div>
      </Link>

      <div
        className={cn(
          "space-y-3",
          isListView ? "flex-1 flex flex-col justify-between" : "p-4"
        )}
      >
        <div className={cn(isListView ? "space-y-2" : "")}>
          <p className="text-xs text-gray-500 uppercase font-medium">
            {product.category?.name}
          </p>
          <Link href={getProductUrl(product)}>
            <h3
              className={cn(
                "font-semibold hover:text-primary transition-colors",
                isListView ? "line-clamp-2" : "line-clamp-2 h-12"
              )}
            >
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {(product.discountPercentage ?? 0) > 0 ? (
            <>
              <PriceFormatter
                amount={product.price}
                className="text-gray-400 line-through text-sm"
              />
              <PriceFormatter
                amount={
                  product.price * (1 - (product.discountPercentage ?? 0) / 100)
                }
                className="text-red-600 font-semibold"
              />
            </>
          ) : (
            <PriceFormatter amount={product.price} className="font-semibold" />
          )}
        </div>

        <div className={cn("flex gap-2", isListView ? "mt-auto" : "")}>
          <Button
            onClick={() => handleRemoveItem(product._id)}
            disabled={removing === product._id}
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50 h-8 w-8 p-0"
          >
            {removing === product._id ? (
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </Button>
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <Container className="py-8">
        <PageBreadcrumb
          items={[{ label: "User", href: "/user/profile" }]}
          currentPage="Wishlist"
          showSocialShare={false}
        />

        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="h-48 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <PageBreadcrumb
        items={[{ label: "User", href: "/user/profile" }]}
        currentPage="Wishlist"
        showSocialShare={false}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Wishlist</h1>
            <p className="text-gray-600">
              {allWishlistIds.length}{" "}
              {allWishlistIds.length === 1 ? "item" : "items"} in your wishlist
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            {wishlistItems.length > 0 && (
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="px-3"
                >
                  <Grid3X3 size={16} />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="px-3"
                >
                  <List size={16} />
                </Button>
              </div>
            )}

            {wishlistItems.length > 0 && (
              <Button
                onClick={handleClearWishlist}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 size={16} className="mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Wishlist Items */}
        {wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Start adding items to your wishlist by clicking the heart icon on
              products you love
            </p>
            <Button asChild>
              <Link href="/shop">
                <ShoppingBag size={16} className="mr-2" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "gap-6",
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5"
                  : "flex flex-col space-y-4"
              )}
            >
              {wishlistItems.map((product: Product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  isListView={viewMode === "list"}
                />
              ))}
            </div>

            {/* Loading More Indicator */}
            {loadingMore && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 size={20} className="animate-spin" />
                  Loading more products...
                </div>
              </div>
            )}

            {/* End of Results */}
            {!hasMore && wishlistItems.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                You&apos;ve reached the end of your wishlist
              </div>
            )}
          </>
        )}
      </div>

      {/* Clear Wishlist Confirmation Modal */}
      <AlertDialog
        open={showClearDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowClearDialog(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Wishlist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear your wishlist? This action cannot
              be undone and all items will be removed from your wishlist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowClearDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearWishlist}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Clear Wishlist
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
};

export default WishlistPage;
