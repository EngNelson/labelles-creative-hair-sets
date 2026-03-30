"use client";

import React, { useState, useEffect } from "react";
import { Product } from "@entry/types";
import ProductDescription from "./ProductDescription";
import { fetchData } from "@/lib/api";

interface ProductDescriptionClientProps {
  initialProduct: Product;
}

const ProductDescriptionClient: React.FC<ProductDescriptionClientProps> = ({
  initialProduct,
}) => {
  const [product, setProduct] = useState<Product>(initialProduct);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to refresh product data
  const refreshProduct = async () => {
    if (!initialProduct._id) return;

    setIsRefreshing(true);
    try {
      const updatedProduct = await fetchData<Product>(
        `/products/${initialProduct._id}`,
        { cache: "no-store" }
      );
      setProduct(updatedProduct);
    } catch (error) {
      console.error("Failed to refresh product:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Update product when initialProduct changes (page navigation)
  useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct]);

  return (
    <>
      {isRefreshing && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary">
          Refreshing product data...
        </div>
      )}
      <ProductDescription
        product={product}
        onReviewSubmitted={refreshProduct}
      />
    </>
  );
};

export default ProductDescriptionClient;
