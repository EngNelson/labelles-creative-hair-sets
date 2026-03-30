import { fetchData } from "@/lib/api";
import { Category } from "@entry/types";
import BannerCarousel from "./BannerCarousel";
import CategorySidebar from "../../common/CategorySidebar";

interface Banner {
  _id: string;
  name: string;
  title: string;
  startFrom: number;
  image: string;
  iconImage: string;
  bannerType: string;
  sale?: string;
  value?: string;
  weight?: number;
}

interface CategoriesResponse {
  categories: Category[];
}

const Banner = async () => {
  let banners: Banner[] = [];
  let rootCategories: Category[] = [];

  try {
    const bannerData = await fetchData<Banner[]>("/banners");
    banners = bannerData;

    // Fetch root categories for the sidebar
    const categoryData = await fetchData<CategoriesResponse>(
      "/categories?parent=null&perPage=10",
      { next: { revalidate: 3600 } },
    );

    rootCategories = categoryData.categories;
  } catch (error) {
    console.error("Error fetching banner data:", error);
  }

  if (banners?.length === 0) {
    return null;
  }

  return (
    <div className="flex items-stretch">
      {/* Categories Sidebar */}
      {rootCategories?.length > 0 && (
        <CategorySidebar
          categories={rootCategories}
          className="hidden lg:flex w-72 h-[400px] md:h-[500px] p-3"
        />
      )}

      {/* Banner Carousel */}
      <div className="relative group overflow-hidden rounded-md flex-1 h-[400px] md:h-[500px] md:pl-5 pt-5">
        <BannerCarousel banners={banners} />
      </div>
    </div>
  );
};

export default Banner;
