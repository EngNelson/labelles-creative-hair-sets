import Container from "@/components/common/Container";
import Banner from "@/components/pages/home/Banner";
import FeaturedCategories from "@/components/pages/home/FeaturedCategories";
import CategoriesSidebar from "@/components/pages/home/CategoriesSidebar";
import HomeAdvertisement from "@/components/pages/home/HomeAdvertisement";
import BecomeSeller from "@/components/pages/home/BecomeSeller";
import ProductTypeSection from "@/components/pages/home/ProductTypeSection";
import AllProductsSection from "@/components/pages/home/AllProductsSection";
import FeaturedOffers from "@/components/pages/home/FeaturedOffers";
import {
  JsonLd,
  generateOrganizationSchema,
  generateWebsiteSchema,
} from "@/lib/structured-data";
import { getSellerConfig } from "@/lib/sellerConfig";
import { fetchData } from "@/lib/api";
import ShopByBrands from "@/components/common/footer/ShopByBrands";
import { cookies } from "next/headers";
import { Metadata } from "next";
export const metadata: Metadata = {
  alternates: {
    canonical: "http://entry.reactbd.com",
  },
};
export const dynamic = "force-dynamic";

interface ProductType {
  _id: string;
  name: string;
  type: string;
  displayOrder: number;
  color?: string;
  isActive: boolean;
}

interface ProductTypesResponse {
  productTypes: ProductType[];
}

interface BaseConfig {
  sidebar: boolean;
  banner: boolean;
  showAds: boolean;
  showCategoryMenu: boolean;
}

interface BaseConfigResponse {
  success: boolean;
  data: BaseConfig;
}

export default async function Home() {
  // Fetch seller config once at page level
  const sellerConfig = await getSellerConfig();

  // Check auth and seller status server-side for the banner
  let isVendor = false;
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth_token")?.value;
    if (authToken) {
      // Decode JWT to check if user has seller role, or call API
      // Since it's a simple banner check, verifying if role="seller" is enough
      // For more accurate status we call /me
      const statusRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sellers/me`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          cache: "no-store",
        },
      );
      if (statusRes.ok) {
        // Any existing vendor application means they don't need the default "Become a seller" pitch exactly the same way
        isVendor = true;
      }
    }
  } catch (error) {
    // Silent fail for banner auth check
  }

  // Fetch base config
  let baseConfig: BaseConfig = {
    sidebar: true,
    banner: true,
    showAds: true,
    showCategoryMenu: true,
  };

  try {
    const baseConfigData = await fetchData<BaseConfigResponse>("/base-config", {
      next: { revalidate: 3600 },
    });
    if (baseConfigData?.data) {
      baseConfig = baseConfigData.data;
    }
  } catch (error) {
    console.error("Error fetching base config:", error);
  }

  // Fetch product types
  let productTypes: ProductType[] = [];
  try {
    const data = await fetchData<ProductTypesResponse>("/product-types");
    productTypes = (Array.isArray(data) ? data : data.productTypes || [])
      .filter((pt) => pt.isActive && pt.displayOrder !== 0) // Filter active and exclude displayOrder 0
      .sort((a, b) => a.displayOrder - b.displayOrder); // Sort by displayOrder
  } catch (error) {
    console.error("Error fetching product types:", error);
  }

  // Group product types by display order
  const firstTwo = productTypes.filter(
    (pt) => pt.displayOrder === 1 || pt.displayOrder === 2,
  );
  const middleTwo = productTypes.filter(
    (pt) => pt.displayOrder === 3 || pt.displayOrder === 4,
  );
  const remaining = productTypes.filter((pt) => pt.displayOrder > 4);

  return (
    <div className="bg-primary-foreground">
      <JsonLd data={generateOrganizationSchema()} />
      <JsonLd data={generateWebsiteSchema()} />
      <Container className="min-h-screen flex flex-col md:flex-row gap-3">
        {baseConfig.sidebar && <CategoriesSidebar />}
        <div className="flex-1 min-w-0">
          {baseConfig.banner && <Banner />}

          {/* Featured Categories Carousel */}
          <FeaturedCategories />

          {/* First 2 product type sections (displayOrder 1 & 2) */}
          {firstTwo.map((productType) => (
            <ProductTypeSection
              key={productType._id}
              productType={productType}
            />
          ))}

          <HomeAdvertisement />

          {/* Middle 2 product type sections (displayOrder 3 & 4) */}
          {middleTwo.map((productType) => (
            <ProductTypeSection
              key={productType._id}
              productType={productType}
            />
          ))}

          <BecomeSeller config={sellerConfig} isVendor={isVendor} />

          {/* Remaining product type sections (displayOrder > 4) */}
          {remaining.map((productType) => (
            <ProductTypeSection
              key={productType._id}
              productType={productType}
            />
          ))}

          {/* Featured Offers */}
          <FeaturedOffers />

          {/* All Products section at the bottom */}
          <AllProductsSection />
          {/* Featured Products banner */}
          <ShopByBrands />
        </div>
      </Container>
    </div>
  );
}
