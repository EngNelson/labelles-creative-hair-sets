"use client";

import Container from "@/components/common/Container";
import ProductCard from "@/components/common/products/ProductCard";
import { fetchData } from "@/lib/api";
import { Brand, Category, Product, Seller } from "@entry/types";
import React, {
  useEffect,
  useState,
  useCallback,
  Suspense,
  useRef,
} from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import EmptyListDesign from "@/components/common/products/EmptyListDesign";
import ShopSkeleton from "@/components/common/skeleton/ShopSkeleton";
import ProductCardSkeleton from "@/components/common/skeleton/ProductCardSkeleton";
import { X, ChevronDown, ChevronUp, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

interface ProductsResponse {
  products: Product[];
  total: number;
}

interface Props {
  categories: Category[];
  brands: Brand[];
  sellers: Seller[];
}

const FeaturesPageContent = ({ categories, brands, sellers }: Props) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Fixed productType for this dedicated page
  const productType = "_featured_products";

  const [category, setCategory] = useState<string>(
    searchParams.get("category") || "",
  );
  const [brand, setBrand] = useState<string>(searchParams.get("brand") || "");
  const [search, setSearch] = useState<string>(
    searchParams.get("search") || "",
  );
  const [seller, setSeller] = useState<string>(
    searchParams.get("seller") || "",
  );
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("sortOrder") as "asc" | "desc") || "asc",
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newlyLoadedProducts, setNewlyLoadedProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [invalidCategory, setInvalidCategory] = useState<string>("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const productsPerPage = 20;

  // Function to update URL with current filter state
  const updateURL = useCallback(
    (filters: {
      category?: string;
      brand?: string;
      search?: string;
      seller?: string;
      priceRange?: [number, number] | null;
      sortOrder?: "asc" | "desc";
    }) => {
      const params = new URLSearchParams();

      if (filters.category) params.set("category", filters.category);
      if (filters.brand) params.set("brand", filters.brand);
      if (filters.search) params.set("search", filters.search);
      if (filters.seller) params.set("seller", filters.seller);
      if (filters.priceRange) {
        params.set("priceMin", filters.priceRange[0].toString());
        params.set("priceMax", filters.priceRange[1].toString());
      }
      if (filters.sortOrder && filters.sortOrder !== "asc") {
        params.set("sortOrder", filters.sortOrder);
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(newUrl, { scroll: false });
    },
    [pathname, router],
  );

  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    const priceMinFromUrl = searchParams.get("priceMin");
    const priceMaxFromUrl = searchParams.get("priceMax");

    if (categoryFromUrl) {
      const categoryExists = categories.some(
        (cat) => cat._id === categoryFromUrl,
      );
      if (!categoryExists) {
        const categoryByName = categories.find(
          (cat) => cat.name.toLowerCase() === categoryFromUrl.toLowerCase(),
        );
        if (categoryByName) {
          setCategory(categoryByName._id);
        } else {
          setInvalidCategory(categoryFromUrl);
          setCategory("");
        }
      }
    }

    const brandFromUrl = searchParams.get("brand");
    const searchFromUrl = searchParams.get("search");
    const sellerFromUrl = searchParams.get("seller");
    const sortOrderFromUrl = searchParams.get("sortOrder") as "asc" | "desc";

    setBrand(brandFromUrl || "");
    setSearch(searchFromUrl || "");
    setSeller(sellerFromUrl || "");
    if (sortOrderFromUrl) setSortOrder(sortOrderFromUrl);
    else setSortOrder("asc");

    if (priceMinFromUrl && priceMaxFromUrl) {
      setPriceRange([Number(priceMinFromUrl), Number(priceMaxFromUrl)]);
    } else {
      setPriceRange(null);
    }
  }, [searchParams, categories]);

  const fetchProducts = useCallback(
    async (loadMore = false) => {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();
        if (category) params.append("category", category);
        if (brand) params.append("brand", brand);
        if (search) params.append("search", search);
        if (seller) params.append("seller", seller);

        // Locked Product Type
        params.append("productType", productType);

        if (priceRange) {
          params.append("priceMin", priceRange[0].toString());
          params.append("priceMax", priceRange[1].toString());
        }
        params.append("page", currentPage.toString());
        params.append("limit", productsPerPage.toString());
        params.append("sortOrder", sortOrder);

        const response: ProductsResponse = await fetchData(
          `/products?${params.toString()}`,
        );

        setTotal(response.total);

        if (loadMore) {
          setTimeout(() => {
            setNewlyLoadedProducts(response.products);
            setProducts((prev) => [...prev, ...response.products]);
            setLoadingMore(false);
          }, 300);
        } else {
          setNewlyLoadedProducts([]);
          setProducts(response.products);
          setLoading(false);
        }
      } catch (error) {
        setTotal(0);
        if (!loadMore) setProducts([]);
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [
      category,
      brand,
      search,
      seller,
      priceRange,
      currentPage,
      sortOrder,
      productsPerPage,
    ],
  );

  useEffect(() => {
    setCurrentPage(1);
    setProducts([]);
  }, [category, brand, search, seller, priceRange, sortOrder]);

  useEffect(() => {
    fetchProducts(currentPage !== 1);
  }, [currentPage, fetchProducts]);

  useEffect(() => {
    if (newlyLoadedProducts.length > 0) {
      const timer = setTimeout(() => setNewlyLoadedProducts([]), 800);
      return () => clearTimeout(timer);
    }
  }, [newlyLoadedProducts]);

  const priceRanges: [number, number][] = [
    [0, 20],
    [20, 50],
    [50, 100],
    [100, Infinity],
  ];

  const totalPages = Math.ceil(total / productsPerPage);
  const hasMoreProducts = currentPage < totalPages;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (loading || loadingMore || !hasMoreProducts) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { root: null, rootMargin: "20px", threshold: 1.0 },
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loading, loadingMore, hasMoreProducts]);

  const resetCategory = () => {
    setCategory("");
    setCurrentPage(1);
    setInvalidCategory("");
    updateURL({ category: "", brand, search, seller, priceRange, sortOrder });
  };

  const resetBrand = () => {
    setBrand("");
    setCurrentPage(1);
    updateURL({ category, brand: "", search, seller, priceRange, sortOrder });
  };

  const resetSearch = () => {
    setSearch("");
    setCurrentPage(1);
    updateURL({ category, brand, search: "", seller, priceRange, sortOrder });
  };

  const resetPriceRange = () => {
    setPriceRange(null);
    setCurrentPage(1);
    updateURL({ category, brand, search, seller, priceRange: null, sortOrder });
  };

  const resetSortOrder = () => {
    setSortOrder("asc");
    setCurrentPage(1);
    updateURL({
      category,
      brand,
      search,
      seller,
      priceRange,
      sortOrder: "asc",
    });
  };

  const resetSeller = () => {
    setSeller("");
    setCurrentPage(1);
    updateURL({ category, brand, search, seller: "", priceRange, sortOrder });
  };

  const resetAllFilters = () => {
    setCategory("");
    setBrand("");
    setSearch("");
    setSeller("");
    setPriceRange(null);
    setSortOrder("asc");
    setCurrentPage(1);
    setInvalidCategory("");
    setProducts([]);
    router.push(pathname, { scroll: false });
  };

  return (
    <Container>
      <div className="py-10">
        <div className="mb-5">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Features</BreadcrumbPage>
              </BreadcrumbItem>
              {category && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {categories.find((c) => c._id === category)?.name ||
                        "Category"}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
              {brand && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {brands.find((b) => b._id === brand)?.name || "Brand"}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Featured Products</h2>
            <div className="flex items-center gap-4 text-gray-600">
              <p>
                {loading
                  ? "Loading..."
                  : `Showing ${products.length} of ${total} products`}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs flex items-center gap-1.5"
                onClick={async () => {
                  const url = window.location.href;
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: "Features - " + document.title,
                        url: url,
                      });
                    } catch (err) {
                      navigator.clipboard.writeText(url);
                      toast.success("Page link copied to clipboard");
                    }
                  } else {
                    navigator.clipboard.writeText(url);
                    toast.success("Page link copied to clipboard");
                  }
                }}
              >
                <Share2 size={14} />
                Share
              </Button>
            </div>
            {invalidCategory && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  Category &quot;{invalidCategory}&quot; not found. Showing all
                  products instead.
                </p>
              </div>
            )}
          </div>
          {(category ||
            brand ||
            search ||
            seller ||
            priceRange ||
            sortOrder !== "asc") && (
            <Button
              variant="outline"
              onClick={resetAllFilters}
              className="text-sm border-primary/20 text-primary hover:bg-primary/5 hover:text-primary hover:border-primary/40 transition-colors flex items-center gap-2"
              disabled={loading}
            >
              <X size={14} className="stroke-3" />
              Reset All Filters
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-5">
          <div className="bg-transparent w-full md:max-w-64 min-w-60">
            <div className="bg-background w-full p-5 rounded-lg border">
              <div className="md:hidden">
                <Button
                  variant="outline"
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  className="w-full mb-4 flex items-center justify-between"
                >
                  <span className="font-medium">Filters</span>
                  {isFiltersOpen ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </Button>
              </div>
              <div className="hidden md:block">
                <h3 className="text-lg font-medium mb-4">Filters</h3>
              </div>
              <div
                className={`${isFiltersOpen ? "block" : "hidden"} md:block space-y-4`}
              >
                {search && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Search</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200">
                        "{search}"
                        <button
                          onClick={resetSearch}
                          className="ml-2 text-blue-500 hover:text-blue-700"
                          disabled={loading}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    </div>
                  </div>
                )}
                <div className="mb-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium mb-2">
                      Category
                    </label>
                    {category && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={resetCategory}
                        disabled={loading}
                        className="text-xs text-blue-600 p-0"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                  <Select
                    value={category || "All"}
                    onValueChange={(value) => {
                      const newCategory = value === "All" ? "" : value;
                      setCategory(newCategory);
                      setCurrentPage(1);
                      setInvalidCategory("");
                      updateURL({
                        category: newCategory,
                        brand,
                        search,
                        seller,
                        priceRange,
                        sortOrder,
                      });
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full p-2 border rounded">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Categories</SelectLabel>
                        <SelectItem value="All">All Categories</SelectItem>
                        {categories.map((cat: Category) => (
                          <SelectItem key={cat?._id} value={cat?._id}>
                            {cat?.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium mb-2">
                      Brand
                    </label>
                    {brand && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={resetBrand}
                        disabled={loading}
                        className="text-xs text-blue-600 p-0"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                  <Select
                    value={brand || "All"}
                    onValueChange={(value) => {
                      const newBrand = value === "All" ? "" : value;
                      setBrand(newBrand);
                      setCurrentPage(1);
                      updateURL({
                        category,
                        brand: newBrand,
                        search,
                        seller,
                        priceRange,
                        sortOrder,
                      });
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full p-2 border rounded">
                      <SelectValue placeholder="Select a brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Brands</SelectLabel>
                        <SelectItem value="All">All Brands</SelectItem>
                        {brands.map((b: Brand) => (
                          <SelectItem key={b._id} value={b._id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium mb-2">
                      Price Range
                    </label>
                    {priceRange && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={resetPriceRange}
                        disabled={loading}
                        className="text-xs text-blue-600 p-0"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setPriceRange(null);
                        setCurrentPage(1);
                        updateURL({
                          category,
                          brand,
                          search,
                          seller,
                          priceRange: null,
                          sortOrder,
                        });
                      }}
                      className={`block w-full text-left px-2 py-1 rounded text-sm ${!priceRange ? "bg-primary/20 text-primary font-medium" : "hover:bg-gray-100"}`}
                      disabled={loading}
                    >
                      All Prices
                    </button>
                    {priceRanges.map((range, index) => {
                      const isSelected =
                        priceRange?.[0] === range[0] &&
                        priceRange?.[1] === range[1];
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setPriceRange(range);
                            setCurrentPage(1);
                            updateURL({
                              category,
                              brand,
                              search,
                              seller,
                              priceRange: range,
                              sortOrder,
                            });
                          }}
                          className={`block w-full text-left px-2 py-1 rounded text-sm ${isSelected ? "bg-primary/20 text-primary font-medium" : "hover:bg-gray-100"}`}
                          disabled={loading}
                        >
                          {range[1] === Infinity
                            ? `$${range[0]}+`
                            : `$${range[0]} - $${range[1]}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium mb-2">
                      Sort By
                    </label>
                    {sortOrder !== "asc" && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={resetSortOrder}
                        disabled={loading}
                        className="text-xs text-blue-600 p-0"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                  <Select
                    value={sortOrder}
                    onValueChange={(value) => {
                      setSortOrder(value as "asc" | "desc");
                      setCurrentPage(1);
                      updateURL({
                        category,
                        brand,
                        search,
                        seller,
                        priceRange,
                        sortOrder: value as "asc" | "desc",
                      });
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full p-2 border rounded">
                      <SelectValue placeholder="Sort order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Price: Low to High</SelectItem>
                      <SelectItem value="desc">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium mb-2">
                      Seller
                    </label>
                    {seller && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={resetSeller}
                        disabled={loading}
                        className="text-xs text-blue-600 p-0"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                  <Select
                    value={seller || "All"}
                    onValueChange={(value) => {
                      const newSeller = value === "All" ? "" : value;
                      setSeller(newSeller);
                      setCurrentPage(1);
                      updateURL({
                        category,
                        brand,
                        search,
                        seller: newSeller,
                        priceRange,
                        sortOrder,
                      });
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full p-2 border rounded">
                      <SelectValue placeholder="Select a seller" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Sellers</SelectLabel>
                        <SelectItem value="All">All Sellers</SelectItem>
                        {sellers.map((vnd: Seller) => (
                          <SelectItem key={vnd?._id} value={vnd?._id}>
                            {vnd?.storeName}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-background p-5 rounded-md w-full">
            {loading && products.length === 0 ? (
              <ShopSkeleton />
            ) : products?.length > 0 ? (
              <div className="w-full">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {products?.map((product, index) => {
                    const isNewlyLoaded = newlyLoadedProducts.some(
                      (newProduct) => newProduct._id === product._id,
                    );
                    return (
                      <div
                        key={`${product._id}-${index}`}
                        className={`transition-all duration-700 ease-out ${
                          isNewlyLoaded
                            ? "opacity-0 translate-y-8 scale-95"
                            : "opacity-100 translate-y-0 scale-100"
                        }`}
                        style={{
                          transitionDelay: isNewlyLoaded
                            ? `${(index % productsPerPage) * 80}ms`
                            : "0ms",
                        }}
                      >
                        <ProductCard product={product} />
                      </div>
                    );
                  })}

                  {loadingMore &&
                    Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={`skeleton-${index}`}
                        className="animate-fadeIn"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <ProductCardSkeleton />
                      </div>
                    ))}
                </div>

                {hasMoreProducts && <div ref={loadMoreRef} className="h-10" />}

                {!hasMoreProducts &&
                  products.length > 0 &&
                  total > 0 &&
                  !loadingMore && (
                    <div className="text-center py-6 mt-6">
                      <p className="text-gray-600 text-lg mb-2">
                        🎉 You've seen it all! No more products to show.
                      </p>
                      <p className="text-gray-500 text-sm">
                        Showing all {products.length} products
                      </p>
                    </div>
                  )}
              </div>
            ) : (
              !loading && (
                <EmptyListDesign
                  message="No products match your selected filters."
                  resetFilters={resetAllFilters}
                />
              )
            )}
          </div>
        </div>
      </div>
    </Container>
  );
};

const FeaturesPageClient = (props: Props) => {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <FeaturesPageContent {...props} />
    </Suspense>
  );
};

export default FeaturesPageClient;
