import { fetchData } from "@/lib/api";
import { Category } from "@entry/types";
import FeaturedCategoriesCarousel from "./FeaturedCategoriesCarousel";

interface CategoriesResponse {
  categories: Category[];
}

const FeaturedCategories = async () => {
  let categories: Category[] = [];

  try {
    const data = await fetchData<CategoriesResponse>(
      "/categories?categoryType=Featured&perPage=20",
      {
        next: { revalidate: 3600 },
      },
    );

    categories = data.categories || [];
  } catch (error) {
    console.error("Error fetching featured categories:", error);
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return <FeaturedCategoriesCarousel categories={categories} />;
};

export default FeaturedCategories;
