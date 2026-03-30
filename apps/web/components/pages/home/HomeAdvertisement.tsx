"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AdsSideBanner from "./AdsSideBanner";

interface Banner {
  _id: string;
  name: string;
  title: string;
  description?: string;
  image: string;
  link?: string;
}

interface HomeAdvertisementProps {
  bannerIds?: string[];
  images?: string[];
}

const HomeAdvertisement = ({ bannerIds, images }: HomeAdvertisementProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        // If specific banner IDs are provided, fetch those
        if (bannerIds && bannerIds.length > 0) {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/banners?ids=${bannerIds.join(",")}`,
          );
          const data = await response.json();
          setBanners(data);
        }
        // If direct images are provided, use them
        else if (images && images.length > 0) {
          const imageBanners = images.map((img, idx) => ({
            _id: `img-${idx}`,
            name: `Banner ${idx + 1}`,
            title: "",
            image: img,
          }));
          setBanners(imageBanners);
        }
        // Otherwise fetch all active advertisement banners from ads-banners API
        else {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/ads-banners`,
          );

          const data = await response.json();
          setBanners(data?.adsBanners || []);
        }
      } catch (error) {
        console.error("Failed to fetch advertisement banners:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, [bannerIds, images]);

  // Auto-play carousel
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  if (isLoading) {
    return (
      <div className="w-full bg-gray-200 rounded-lg h-[400px] md:h-[500px] animate-pulse mt-3" />
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-3 flex flex-col lg:flex-row items-stretch gap-4">
      <div className="relative group flex-1 lg:w-8/12 rounded-lg overflow-hidden border">
        {/* Carousel Images */}
        <div className="relative w-full h-[400px] overflow-hidden">
          {banners.map((banner, index) => (
            <div
              key={banner._id}
              className={`absolute inset-0 transition-opacity duration-500 flex flex-col md:flex-row ${
                index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {/* Text Content - Left Half */}
              <div className="absolute inset-y-0 left-0 w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 py-8 md:py-0 z-10 bg-muted/90 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none">
                <div className="flex flex-col gap-2 md:gap-4 items-start max-w-sm pointer-events-auto">
                  <p className="font-semibold text-sm tracking-wide text-muted-foreground uppercase">
                    {banner.name || "Special Offer"}
                  </p>

                  {(banner.title || banner.name) && (
                    <h2 className="text-3xl font-bold text-foreground leading-tight">
                      {banner.title || banner.name}
                    </h2>
                  )}

                  {banner.description && (
                    <p className="text-sm md:text-base text-muted-foreground font-medium">
                      {banner.description}
                    </p>
                  )}

                  <Link
                    href={banner.link || "/shop"}
                    className="mt-2 md:mt-4 bg-transparent text-foreground border border-primary hover:bg-primary hover:text-primary-foreground px-6 py-2.5 min-w-[140px] text-center rounded-md font-semibold transition-colors duration-300"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>

              {/* Image Content - Right Half / Full Height */}
              <div className="absolute inset-y-0 right-0 w-full md:w-1/2 h-full">
                {banner.link ? (
                  <Link
                    href={banner.link}
                    className="block w-full h-full relative"
                  >
                    <Image
                      src={banner.image}
                      alt={banner.name || `Advertisement ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={index === 0}
                      unoptimized={banner.image.startsWith("data:")}
                    />
                  </Link>
                ) : (
                  <Image
                    src={banner.image}
                    alt={banner.name || `Advertisement ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={index === 0}
                    unoptimized={banner.image.startsWith("data:")}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Dots Indicator */}
        {banners.length > 1 && (
          <div className="absolute bottom-8 left-8 md:left-16 flex gap-2 z-20">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 border border-muted-foreground/30 ${
                  index === currentSlide
                    ? "bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right Side Promotion Ads Banner */}
      <div className="w-full lg:w-4/12 min-w-[320px]">
        <AdsSideBanner />
      </div>
    </div>
  );
};

export default HomeAdvertisement;
