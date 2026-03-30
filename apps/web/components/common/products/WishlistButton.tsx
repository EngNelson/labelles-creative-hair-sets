"use client";
import React, { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useUserStore, useWishlistStore } from "../../../lib/store";
import { addToWishlist, removeFromWishlist } from "../../../lib/wishlistApi";
import { Product } from "@entry/types";
import { useIsHydrated } from "../../../hooks";
import { useAuthSidebarStore } from "@/lib/useAuthSidebarStore";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WishlistButtonProps {
  product: Product;
  className?: string;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({
  product,
  className = "",
}) => {
  const { isAuthenticated, auth_token } = useUserStore();
  const { openLogin } = useAuthSidebarStore();
  const {
    isInWishlist,
    addToWishlist: addToWishlistStore,
    removeFromWishlist: removeFromWishlistStore,
  } = useWishlistStore();
  const [isLoading, setIsLoading] = useState(false);
  const isHydrated = useIsHydrated();

  const isInWishlistState = isHydrated ? isInWishlist(product._id) : false;

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if inside a Link
    e.stopPropagation();

    if (!isAuthenticated || !auth_token) {
      toast.error("Please sign in to add items to wishlist");
      openLogin();
      return;
    }

    setIsLoading(true);

    try {
      if (isInWishlistState) {
        // Remove from wishlist
        await removeFromWishlist(product._id, auth_token);
        removeFromWishlistStore(product._id);
        toast.success("Removed from wishlist");
      } else {
        // Add to wishlist
        await addToWishlist(product._id, auth_token);
        addToWishlistStore(product);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast.error("Failed to update wishlist");
    } finally {
      setIsLoading(false);
    }
  };

  // if (!isAuthenticated || !isHydrated) {
  //   return null;
  // }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleWishlistToggle}
          disabled={isLoading}
          className={`p-2 rounded-full transition-colors hover:bg-accent hover:text-white ${
            isInWishlistState ? "bg-accent text-white" : "text-muted-foreground"
          } ${isLoading ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
        >
          <Heart
            size={20}
            fill={isInWishlistState ? "currentColor" : "none"}
            className={isLoading ? "animate-pulse" : ""}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="font-medium">
        <p>{isInWishlistState ? "Remove from wishlist" : "Add to wishlist"}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default WishlistButton;
