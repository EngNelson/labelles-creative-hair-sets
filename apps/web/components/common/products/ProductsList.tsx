import { fetchData } from "../../../lib/api";
import { Product } from "@entry/types";
import React from "react";
import ProductList from "./ProductList";

interface ProductsResponse {
  products: Product[];
}

const ProductsList = async () => {
  let products: Product[] = [];

  try {
    const data = await fetchData<ProductsResponse>(
      "/products?perPage=10&excludeProductType=trending"
    );
    products = data.products;
  } catch (error) {
  }

  if (products?.length === 0) {
    return (
      <div className="bg-background p-5 rounded-md border">
        <p className="text-xl font-semibold">No Products Available</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-background border mt-3 rounded-md">
      <ProductList products={products} />
    </div>
  );
};

export default ProductsList;
