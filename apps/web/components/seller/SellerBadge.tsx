import { Store } from "lucide-react";
import Link from "next/link";

interface SellerBadgeProps {
  seller: {
    _id: string;
    storeName: string;
    logo?: string;
  };
  size?: "sm" | "md" | "lg";
  showLink?: boolean;
}

export default function SellerBadge({
  seller,
  size = "md",
  showLink = true,
}: SellerBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const badge = (
    <div
      className={`inline-flex items-center gap-2 bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-full ${sizeClasses[size]} font-medium shadow-md hover:shadow-lg transition-shadow`}
    >
      {seller.logo ? (
        <img
          src={seller.logo}
          alt={seller.storeName}
          className={`${iconSizes[size]} rounded-full object-cover bg-white`}
        />
      ) : (
        <Store className={iconSizes[size]} />
      )}
      <span>Sold by {seller.storeName}</span>
    </div>
  );

  if (showLink) {
    return (
      <Link href={`/seller/${seller._id}`} className="inline-block">
        {badge}
      </Link>
    );
  }

  return badge;
}
