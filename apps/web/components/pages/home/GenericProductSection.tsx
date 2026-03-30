import { fetchData, buildQueryString } from "@/lib/api";
import { Product } from "@entry/types";
import React from "react";
import ProductTypeCarousel from "./ProductTypeCarousel";
import Link from "next/link";

interface GenericProductSectionProps {
  config: any; // Using any for simplicity as we know the shape from WebsiteConfig
}

interface ProductsResponse {
  products: Product[];
}

const GenericProductSection = async ({
  config,
}: GenericProductSectionProps) => {
  let products: Product[] = [];

  const settings = config.settings || {};
  const filter = settings.productFilter || {};

  // Build query params
  const params: Record<string, any> = {
    perPage: settings.productsLimit || 10,
  };

  if (filter.category) params.category = filter.category;
  if (filter.brand) params.brand = filter.brand;
  if (filter.tags && filter.tags.length > 0)
    params.tags = filter.tags.join(",");
  if (filter.isFeatured) params.isFeatured = true;
  if (filter.isOnSale) params.isOnSale = true;
  if (filter.minPrice) params.minPrice = filter.minPrice;
  if (filter.maxPrice) params.maxPrice = filter.maxPrice;

  const queryString = buildQueryString(params);

  try {
    const data = await fetchData<ProductsResponse>(`/products${queryString}`);
    products = data.products || [];
  } catch (error) {
    console.error(`Error fetching products for ${config.title}:`, error);
  }

  // Don't render if no products
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-full bg-background border mt-3 rounded-md overflow-hidden">
      <div className="p-5 border-b flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{config.title}</h2>
          {config.description && (
            <p className="text-sm text-gray-500 mt-1">{config.description}</p>
          )}
        </div>
        <Link
          href={`/shop${queryString}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          View All →
        </Link>
      </div>
      <div className="w-full overflow-hidden">
        <ProductTypeCarousel products={products} />
      </div>
    </div>
  );
};

export default GenericProductSection;
