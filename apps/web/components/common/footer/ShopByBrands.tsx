import React from "react";
import { fetchData } from "@/lib/api";
import ShopByBrandsCarousel from "./ShopByBrandsCarousel";

interface Brand {
  _id: string;
  name: string;
  image: string;
}

export default async function ShopByBrands() {
  let brands: Brand[] = [];

  try {
    const data = await fetchData<Brand[]>("/brands", {
      next: { revalidate: 3600 },
    });
    if (Array.isArray(data)) {
      brands = data;
    }
  } catch (error) {
    console.error("Error fetching brands:", error);
  }

  if (!brands || brands.length === 0) {
    return null;
  }

  return <ShopByBrandsCarousel brands={brands} />;
}
