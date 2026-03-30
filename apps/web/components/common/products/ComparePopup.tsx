"use client";

import React, { useEffect, useState } from "react";
import { useCompareStore } from "@/lib/useCompareStore";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";

export default function ComparePopup() {
  const { isPopupOpen, setPopupOpen, recentAddedProduct, compareItems } =
    useCompareStore();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  const handleClose = () => {
    setPopupOpen(false);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let interval: NodeJS.Timeout;

    if (isPopupOpen) {
      setCountdown(5);

      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      timer = setTimeout(() => {
        handleClose();
      }, 5000);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isPopupOpen, setPopupOpen]);

  // Don't render until we have a product to show
  if (!recentAddedProduct) return null;

  return (
    <Dialog open={isPopupOpen} onOpenChange={setPopupOpen}>
      <DialogContent className="sm:max-w-[425px] p-8" hideCloseButton>
        <VisuallyHidden>
          <DialogTitle>Compare Product Added</DialogTitle>
        </VisuallyHidden>

        {/* Custom Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <XIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          <span className="sr-only">Close</span>
        </button>

        <div className="flex flex-col items-center gap-6 text-center">
          <div className="bg-accent/10 border border-accent/20 text-foreground px-6 py-4 rounded-md w-full text-sm font-medium leading-relaxed">
            You added product{" "}
            <span className="font-bold">{recentAddedProduct.name}</span> to the
            comparison list.
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
            <Button
              variant="outline"
              className="flex-1 font-medium text-sm h-11 border-border"
              onClick={handleClose}
            >
              Continue ({countdown})
            </Button>
            <Button
              className="flex-1 font-medium text-sm h-11"
              onClick={() => {
                handleClose();
                router.push("/compare");
              }}
            >
              Compare Products
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
