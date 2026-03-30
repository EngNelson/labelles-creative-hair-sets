"use client";

import { Shuffle } from "lucide-react";
import Link from "next/link";
import { useCompareStore } from "@/lib/useCompareStore";
import { useEffect, useState } from "react";

const CompareIcon = () => {
  const { compareItems } = useCompareStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Link
      href="/compare"
      className="group relative flex items-center justify-center gap-2 hover:text-accent hoverEffect"
    >
      <div className="relative">
        <Shuffle className="h-6 w-6 group-hover:text-accent hoverEffect" />
        {isMounted && compareItems.length > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white shadow-sm">
            {compareItems.length}
          </span>
        )}
      </div>
    </Link>
  );
};

export default CompareIcon;
