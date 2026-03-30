import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import SellerDashboardLayout from "@/components/seller/SellerDashboardLayout";

export const metadata = {
  title: "Seller Dashboard - Entry Ecommerce",
  description: "Manage your seller account and products",
};
export const dynamic = "force-dynamic";

async function checkSellerAccess() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return null;
    }

    // Check if user is authenticated
    const userResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || process.env.API_ENDPOINT}/api/auth/profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!userResponse.ok) {
      return null;
    }

    const userData = await userResponse.json();

    if (!userData || !userData._id) {
      return null;
    }

    // Check seller status
    const sellerResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || process.env.API_ENDPOINT}/api/sellers/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!sellerResponse.ok) {
      return { needsApplication: true };
    }

    const sellerData = await sellerResponse.json();

    // API returns { success: true, data: seller }
    const seller = sellerData.data || sellerData.seller;

    if (!seller) {
      return { needsApplication: true };
    }

    if (seller.status !== "approved") {
      return {
        needsApplication: false,
        status: seller.status,
      };
    }

    return {
      approved: true,
      seller: seller,
    };
  } catch (error) {
    console.error("Error checking seller access:", error);
    return null;
  }
}

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sellerAccess = await checkSellerAccess();

  if (!sellerAccess) {
    redirect("/auth/signin?redirect=/seller");
  }

  if (sellerAccess.needsApplication) {
    redirect("/become-seller");
  }

  if (sellerAccess.status === "pending" || sellerAccess.status === "rejected") {
    redirect("/seller-guide");
  }

  return <SellerDashboardLayout>{children}</SellerDashboardLayout>;
}
