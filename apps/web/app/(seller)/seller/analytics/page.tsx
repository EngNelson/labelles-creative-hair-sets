"use client";

import { BarChart3 } from "lucide-react";

export default function SellerAnalyticsPage() {
  return (
    <div className="bg-white rounded-lg shadow p-12 text-center">
      <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Analytics Coming Soon
      </h3>
      <p className="text-gray-600">
        Detailed analytics and insights about your sales and products will be
        available here.
      </p>
    </div>
  );
}
