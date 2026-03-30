import { fetchData } from "../../../lib/api";
import { Product } from "@entry/types";
import React from "react";
import ProductTypeCarousel from "./ProductTypeCarousel";
import Link from "next/link";

interface ProductsResponse {
  products: Product[];
}

interface AllProductsSectionProps {
  title?: string;
  description?: string;
}

const AllProductsSection = async ({
  title = "All Products",
  description,
}: AllProductsSectionProps = {}) => {
  let products: Product[] = [];

  try {
    const data = await fetchData<ProductsResponse>(
      "/products?perPage=20&page=1",
    );
    products = data.products || [];
  } catch (error) {
    console.error("Error fetching all products:", error);
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-full mt-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <Link
          href="/shop"
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          View All →
        </Link>
      </div>
      <div className="w-full">
        <ProductTypeCarousel
          products={products}
          rows={2}
          navigationPosition="bottom"
        />
      </div>
    </div>
  );
};

export default AllProductsSection;
