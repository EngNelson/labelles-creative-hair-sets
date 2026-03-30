"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { useCompareStore } from "@/lib/useCompareStore";
import { Product } from "@entry/types";
import Image from "next/image";
import { useDebounce } from "use-debounce";
import { fetchData } from "@/lib/api";

export default function CompareSearch({
  placeholder = "Search for products to compare...",
}: {
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 500);
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { addToCompare, compareItems } = useCompareStore();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function searchProducts() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response: any = await fetchData(
          `/products?page=1&limit=5&search=${encodeURIComponent(debouncedQuery)}`,
        );
        if (response && response.products) {
          setResults(response.products);
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Failed to search products", error);
      } finally {
        setIsLoading(false);
      }
    }

    searchProducts();
  }, [debouncedQuery]);

  const handleAdd = (product: Product) => {
    addToCompare(product);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          className="w-full h-10 pl-9 pr-4 text-sm bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-2 bg-card border border-border rounded-md shadow-lg z-50 overflow-hidden max-h-[300px] overflow-y-auto">
          <ul className="divide-y divide-border">
            {results.map((product) => {
              const isAdded = compareItems.some(
                (item) => item._id === product._id,
              );
              return (
                <li
                  key={product._id}
                  className="p-2 hover:bg-accent/10 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-white rounded flex-shrink-0 flex items-center justify-center border border-border overflow-hidden p-1">
                        <Image
                          src={
                            product.images?.[0] ||
                            product.image ||
                            "/images/placeholder.png"
                          }
                          alt={product.name}
                          width={40}
                          height={40}
                          className="object-contain"
                        />
                      </div>
                      <p className="text-sm font-medium line-clamp-2 text-foreground">
                        {product.name}
                      </p>
                    </div>

                    <button
                      disabled={isAdded}
                      onClick={() => handleAdd(product)}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium flex-shrink-0 ${
                        isAdded
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {isAdded ? "Added" : "Compare"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {isOpen && !isLoading && debouncedQuery && results.length === 0 && (
        <div className="absolute top-full left-0 w-full mt-2 bg-card border border-border rounded-md shadow-lg z-50 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            No products found matching "{debouncedQuery}"
          </p>
        </div>
      )}
    </div>
  );
}
