import NewArrivalsPageClient from "@/components/pages/new-arrivals/NewArrivalsClient";
import { fetchData } from "@/lib/api";
import { Brand, Category, Seller } from "@entry/types";

// Removed ProductType fetch because NewArrivalsPage is hardcoded to "new-arrivals"

interface CategoriesResponse {
  categories: Category[];
}

const NewArrivalsPageServer = async () => {
  let brands: Brand[] = [];
  let categories: Category[] = [];
  let sellers: Seller[] = [];
  let error: string | null = null;

  try {
    brands = await fetchData<Brand[]>("/brands");
  } catch (err) {
    console.error("Failed to fetch brands during build:", err);
  }

  try {
    const data = await fetchData<CategoriesResponse>("/categories");
    categories = data.categories;
  } catch (err) {
    error = err instanceof Error ? err.message : "An unknown error occurred";
    console.error("Failed to fetch categories during build:", error);
  }

  try {
    const data = await fetchData<Seller[]>("/sellers/approved");
    sellers = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Failed to fetch sellers during build:", err);
  }

  return (
    <div>
      <NewArrivalsPageClient
        categories={categories}
        brands={brands}
        sellers={sellers}
      />
    </div>
  );
};

export default NewArrivalsPageServer;
