"use client";

import { Store } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useUserStore } from "../../../lib/store";

const SellerBadge = () => {
  const { isAuthenticated, authUser } = useUserStore();
  const [isSeller, setIsSeller] = useState(false);
  const [sellerStatus, setSellerStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && authUser) {
      checkSellerStatus();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, authUser]);

  const checkSellerStatus = async () => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sellers/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const seller = data.data || data.seller;
        if (seller) {
          setIsSeller(true);
          setSellerStatus(seller.status);
        }
      }
    } catch (error) {
      console.error("Failed to check seller status:", error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show anything if not authenticated or not a seller
  if (!isAuthenticated || !authUser || !isSeller || loading) {
    return null;
  }

  // Only show for approved sellers or seller role
  if (sellerStatus !== "approved" && authUser.role !== "seller") {
    return null;
  }

  return (
    <Link href="/seller" className="relative group" title="Seller Dashboard">
      <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary-foreground transition-all">
        <Store className="h-5 w-5 text-primary" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
        </span>
      </div>
    </Link>
  );
};

export default SellerBadge;
