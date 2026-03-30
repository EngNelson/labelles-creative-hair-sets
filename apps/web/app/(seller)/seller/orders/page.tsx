"use client";

import { Package } from "lucide-react";

export default function SellerOrdersPage() {
  return (
    <div className="bg-white rounded-lg shadow p-12 text-center">
      <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Orders Coming Soon
      </h3>
      <p className="text-gray-600">
        You'll be able to view and manage your orders here once customers start
        purchasing your products.
      </p>
    </div>
  );
}
