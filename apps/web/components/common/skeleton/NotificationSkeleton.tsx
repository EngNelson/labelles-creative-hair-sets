import React from "react";
import { Card } from "@/components/ui/card";

const NotificationSkeleton = () => {
  return (
    <Card className="p-4 animate-pulse">
      <div className="flex items-start gap-4">
        {/* Icon skeleton */}
        <div className="shrink-0 mt-1">
          <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2">
              {/* Title skeleton */}
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>

              {/* Message skeleton */}
              <div className="space-y-1">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>

              {/* Time skeleton */}
              <div className="h-3 bg-gray-200 rounded w-1/4 mt-2"></div>
            </div>

            {/* Delete button skeleton */}
            <div className="shrink-0">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* New indicator skeleton */}
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
            <div className="h-3 bg-gray-200 rounded w-8"></div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default NotificationSkeleton;
