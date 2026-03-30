"use client";

import { Product } from "@entry/types";
import React from "react";
import { Eye, Shuffle } from "lucide-react";
import WishlistButton from "./WishlistButton";
import { useCompareStore } from "@/lib/useCompareStore";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ProductCardActionsProps {
  product: Product;
}

const ActionBtn = ({
  children,
  title,
  onClick,
  className,
}: {
  children: React.ReactNode;
  title: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        onClick={onClick}
        className={cn(
          "h-9 w-9 flex items-center justify-center rounded-md border border-border bg-card text-muted-foreground shadow-sm hover:bg-accent hover:text-white hover:border-accent hover:shadow-md transition-all duration-200 active:scale-95",
          className,
        )}
      >
        {children}
      </button>
    </TooltipTrigger>
    <TooltipContent side="left" className="font-medium">
      <p>{title}</p>
    </TooltipContent>
  </Tooltip>
);

const ProductCardActions = ({ product }: ProductCardActionsProps) => {
  const { isInCompare, addToCompare, removeFromCompare } = useCompareStore();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const isCompared = isMounted ? isInCompare(product._id) : false;

  return (
    <div className="absolute right-3 top-3 z-10 flex flex-col gap-2 opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out">
      {/* Wishlist */}
      <WishlistButton
        product={product}
        className="h-9 w-9 flex items-center justify-center rounded-md border border-border bg-card text-muted-foreground shadow-sm hover:bg-accent hover:text-white hover:border-accent hover:shadow-md transition-all duration-200 active:scale-95"
      />

      <ActionBtn
        title={isCompared ? "Remove from Compare" : "Compare"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isCompared) {
            removeFromCompare(product._id);
          } else {
            addToCompare(product);
          }
        }}
        className={
          isCompared
            ? "bg-accent !text-white border-accent shadow-md"
            : undefined
        }
      >
        <Shuffle className="h-4 w-4" />
      </ActionBtn>

      <ActionBtn title="Quick View">
        <Eye className="h-4 w-4" />
      </ActionBtn>
    </div>
  );
};

export default ProductCardActions;
