import { fetchData } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

interface ProductTypePopulated {
  _id: string;
  name: string;
  type: string;
  color?: string;
}

interface ProductBanner {
  _id: string;
  title: string;
  description?: string;
  image: string;
  buttonTitle?: string;
  buttonHref?: string;
  isActive: boolean;
  order: number;
  productType: ProductTypePopulated;
}

interface ProductBannersResponse {
  productBanners: ProductBanner[];
}

export default async function FeaturedOffers() {
  let banners: ProductBanner[] = [];

  try {
    const data = await fetchData<ProductBannersResponse>("/product-banners", {
      next: { revalidate: 3600 },
    });

    const allBanners = data?.productBanners || [];
    banners = allBanners.filter(
      (b) => b.productType?.type === "_featured_offers",
    );
  } catch (error) {
    // If the endpoint is not available or returns a 404/500, we simply log it
    // and proceed with an empty array so the SSR doesn't fail completely.
    console.warn(
      "Featured offers could not be fetched (endpoint might be unavailable yet).",
    );
    banners = [];
  }

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <section className="py-8 md:py-12">
      <div className="flex justify-between items-center mb-8 md:mb-12">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          Our Featured Offers
        </h2>
        <Link
          href="/shop"
          className="text-sm font-semibold hover:underline flex items-center gap-1 underline-offset-4"
        >
          View More
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
        {banners.map((banner) => (
          <div
            key={banner._id}
            className="flex flex-col items-center text-center"
          >
            {/* Circular Image Container */}
            <div className="w-48 h-48 sm:w-56 sm:h-56 lg:w-60 lg:h-60 rounded-full flex items-center justify-center mb-6 relative overflow-hidden group">
              <Image
                src={banner.image}
                alt={banner.title}
                fill
                className="object-cover group-hover:scale-105 hoverEffect"
                sizes="(max-width: 768px) 192px, 240px"
              />
            </div>

            {/* Content */}
            <h3 className="text-lg md:text-xl font-bold mb-3 leading-snug">
              {banner.title}
            </h3>

            {banner.description && (
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-[250px] line-clamp-2">
                {banner.description}
              </p>
            )}

            {banner.buttonTitle && banner.buttonHref && (
              <Link
                href={banner.buttonHref}
                className="mt-auto px-6 py-2.5 border border-border rounded-sm hover:bg-black hover:text-white text-sm font-medium hoverEffect"
              >
                {banner.buttonTitle}
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
