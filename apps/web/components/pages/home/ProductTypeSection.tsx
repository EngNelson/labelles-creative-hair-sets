import { fetchData } from "../../../lib/api";
import { Product } from "@entry/types";
import React from "react";
import ProductTypeCarousel from "./ProductTypeCarousel";
import Link from "next/link";

interface ProductsResponse {
  products: Product[];
}

interface ProductType {
  _id: string;
  name: string;
  type: string;
  displayOrder: number;
  color?: string;
}

interface ProductTypeSectionProps {
  productType: ProductType;
}

const ProductTypeSection = async ({ productType }: ProductTypeSectionProps) => {
  let products: Product[] = [];

  try {
    const data = await fetchData<ProductsResponse>(
      `/products?productType=${productType.type}&perPage=20`,
    );
    products = data.products || [];
  } catch (error) {
    console.error(`Error fetching products for ${productType.name}:`, error);
  }

  // Don't render if no products
  if (!products || products.length === 0) {
    return null;
  }

  const getViewMoreLink = (type: string) => {
    if (type === "_new_arrivals") return "/new-arrivals";
    if (type === "_featured_products") return "/features";
    return `/shop?productType=${type}`;
  };

  return (
    <div className="w-full mt-10 rounded-md">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {productType.name}
          </h2>
        </div>
        <Link
          href={getViewMoreLink(productType.type)}
          className="text-sm underline underline-offset-4 hover:text-accent hoverEffect"
        >
          View More
        </Link>
      </div>

      <ProductTypeCarousel
        products={products}
        navigationPosition="responsive"
      />
    </div>
  );
};

export default ProductTypeSection;
