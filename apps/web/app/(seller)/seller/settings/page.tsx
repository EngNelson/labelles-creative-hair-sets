"use client";

import { Settings } from "lucide-react";

export default function SellerSettingsPage() {
  return (
    <div className="bg-white rounded-lg shadow p-12 text-center">
      <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Settings Coming Soon
      </h3>
      <p className="text-gray-600">
        You'll be able to manage your store settings, profile, and preferences
        here.
      </p>
    </div>
  );
}
