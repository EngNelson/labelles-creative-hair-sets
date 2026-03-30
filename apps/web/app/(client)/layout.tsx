import type { Metadata } from "next";
import React from "react";
import Header from "@/components/common/header/Header";
import Footer from "@/components/common/footer/Footer";
import SubscriptionModal from "@/components/common/SubscriptionModal";
import { fetchData } from "@/lib/api";
import { Category } from "@entry/types";
import ComparePopup from "@/components/common/products/ComparePopup";

// Server-side function to fetch logo with proper error handling
async function fetchLogo(): Promise<string | null> {
  try {
    // Use API_ENDPOINT for server-side, fallback to NEXT_PUBLIC_API_URL
    const apiUrl =
      process.env.API_ENDPOINT ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000";

    const response = await fetch(`${apiUrl}/api/website-icons/key/main_logo`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data?.imageUrl) {
        return data.data.imageUrl;
      }
    }
  } catch (error) {
    // Silently fail and use default logo - don't crash the page
    console.error("Error fetching logo (using default):", error);
  }
  return null;
}

// Server-side function to fetch base config
async function fetchBaseConfig() {
  try {
    const apiUrl =
      process.env.API_ENDPOINT ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000";

    const response = await fetch(`${apiUrl}/api/base-config`, {
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (error) {
    console.error("Error fetching base config:", error);
  }
  return null;
}

export const metadata: Metadata = {
  metadataBase: new URL("http://entry.reactbd.com"),
  title: {
    default: "Entry Ecommerce Platform - Shop Online",
    template: "%s | Entry",
  },
  description:
    "Entry Ecommerce Platform — discover thousands of products at great prices. Trusted sellers, fast delivery, and secure payments. Your all-in-one online shopping destination.",
  keywords: [
    "ecommerce",
    "online shopping",
    "entry ecommerce",
    "buy online",
    "best deals",
    "fast delivery",
    "secure payment",
  ],
  authors: [{ name: "Entry Team" }],
  creator: "Entry",
  publisher: "Entry",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "http://entry.reactbd.com",
    siteName: "Entry Ecommerce Platform",
    title: "Entry Ecommerce Platform - Shop Online",
    description:
      "Discover thousands of products at great prices. Trusted sellers, fast delivery, and secure payments.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Entry Ecommerce Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Entry Ecommerce Platform",
    description:
      "Discover thousands of products at great prices with fast delivery.",
    images: ["/og-image.jpg"],
    creator: "@entryecommerce",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-site-verification-code",
  },
  alternates: {
    canonical: "http://entry.reactbd.com",
  },
};

// Server-side function to fetch categories
interface CategoriesResponse {
  categories: Category[];
}

// Server-side function to fetch categories
async function fetchCategories() {
  try {
    const data = await fetchData<CategoriesResponse>(
      "/categories?parent=null&perPage=10",
      {
        next: { revalidate: 3600 },
      },
    );

    if (data?.categories) {
      return data.categories;
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
  }
  return [];
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const logoUrl = await fetchLogo();
  const baseConfig = await fetchBaseConfig();
  const categories = await fetchCategories();

  return (
    <>
      <Header
        logoUrl={logoUrl}
        baseConfig={baseConfig}
        categories={categories}
      />
      <div className="bg-muted min-h-screen pb-20">{children}</div>
      <Footer />
      <ComparePopup />
      {/* Set forceShow={true} temporarily to test the modal */}
      {/* <SubscriptionModal delay={3000} /> */}
    </>
  );
}
