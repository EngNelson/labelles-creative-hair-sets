import { fetchData } from "../../../lib/api";
import { Product } from "@entry/types";
import React from "react";
import ProductTypeCarousel from "./ProductTypeCarousel";
import Link from "next/link";

interface ProductsResponse {
  products: Product[];
}

interface FeaturedProductsProps {
  title?: string;
  description?: string;
  productFilter?: {
    tags?: string[];
  };
  categoryIds?: string[];
  brandIds?: string[];
}

const FeaturedProducts = async ({
  title = "Featured Products",
  description,
  productFilter,
  categoryIds,
  brandIds,
}: FeaturedProductsProps = {}) => {
  let products: Product[] = [];

  try {
    // Build query parameters based on filters
    const params = new URLSearchParams();
    params.append("productType", "featured");
    params.append("perPage", "20");

    if (productFilter?.tags && productFilter.tags.length > 0) {
      params.append("tags", productFilter.tags.join(","));
    }

    if (categoryIds && categoryIds.length > 0) {
      params.append("categories", categoryIds.join(","));
    }

    if (brandIds && brandIds.length > 0) {
      params.append("brands", brandIds.join(","));
    }

    const data = await fetchData<ProductsResponse>(
      `/products?${params.toString()}`,
    );
    products = data.products || [];

    // Fallback: If no featured products found, fetch regular products
    if (products.length === 0) {
      const fallbackParams = new URLSearchParams();
      fallbackParams.append("perPage", "20");
      fallbackParams.append("page", "1");

      if (categoryIds && categoryIds.length > 0) {
        fallbackParams.append("categories", categoryIds.join(","));
      }

      if (brandIds && brandIds.length > 0) {
        fallbackParams.append("brands", brandIds.join(","));
      }

      const fallbackData = await fetchData<ProductsResponse>(
        `/products?${fallbackParams.toString()}`,
      );
      products = fallbackData.products || [];
    }
  } catch (error) {
    console.error("Error fetching featured products:", error);
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-full bg-background border mt-3 rounded-md">
      <div className="p-5 border-b flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <Link
          href="/products?productType=featured"
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          View All →
        </Link>
      </div>
      <div className="w-full">
        <ProductTypeCarousel products={products} />
      </div>
    </div>
  );
};

export default FeaturedProducts;
