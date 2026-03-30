import ShopPage from "@/components/pages/shop/ShopPageClient";
import { fetchData } from "@/lib/api";
import { Brand, Category, ProductType, Seller } from "@entry/types";

interface CategoriesResponse {
  categories: Category[];
}

const ShopPageServer = async () => {
  let brands: Brand[] = [];
  let categories: Category[] = [];
  let productTypes: ProductType[] = [];
  let sellers: Seller[] = [];
  let error: string | null = null;

  try {
    brands = await fetchData<Brand[]>("/brands");
  } catch (err) {
    console.error("Failed to fetch brands during build:", err);
    // Continue with empty brands array
  }

  try {
    const data = await fetchData<CategoriesResponse>("/categories");
    categories = data.categories;
  } catch (err) {
    error = err instanceof Error ? err.message : "An unknown error occurred";
    console.error("Failed to fetch categories during build:", error);
    // Continue with empty categories array
  }

  try {
    const data = await fetchData<ProductType[]>("/product-types");
    productTypes = Array.isArray(data) ? data.filter((pt) => pt.isActive) : [];
  } catch (err) {
    console.error("Failed to fetch product types during build:", err);
  }

  try {
    const data = await fetchData<Seller[]>("/sellers/approved");
    sellers = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Failed to fetch sellers during build:", err);
  }

  return (
    <div>
      <ShopPage
        categories={categories}
        brands={brands}
        productTypes={productTypes}
        sellers={sellers}
      />
    </div>
  );
};

export default ShopPageServer;
