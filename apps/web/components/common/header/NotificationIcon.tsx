"use client";
import { Bell } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useUserStore } from "../../../lib/store";
import { useIsHydrated } from "../../../hooks";
import { getUnreadCount } from "../../../lib/notificationApi";

const NotificationIcon = () => {
  const { isAuthenticated, authUser, auth_token } = useUserStore();
  const isHydrated = useIsHydrated();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!auth_token) return;

      try {
        const count = await getUnreadCount(auth_token);
        setNotificationCount(count);
      } catch (error) {
        console.error("NotificationIcon: Failed to fetch unread count:", error);
      }
    };

    if (isAuthenticated && authUser && auth_token && isHydrated) {
      fetchUnreadCount();

      // Listen for custom events to refresh count immediately
      const handleCountUpdate = (event: CustomEvent) => {
        setNotificationCount(event.detail);
      };

      window.addEventListener(
        "notificationCountUpdate",
        handleCountUpdate as EventListener
      );

      return () => {
        window.removeEventListener(
          "notificationCountUpdate",
          handleCountUpdate as EventListener
        );
      };
    }
  }, [isAuthenticated, authUser, auth_token, isHydrated]);

  // Only show for authenticated users and after hydration
  if (!isAuthenticated || !authUser || !isHydrated) {
    return null;
  }

  return (
    <Link
      href="/user/notifications"
      className="relative hover:text-accent hoverEffect"
      title="Notifications"
    >
      <Bell size={24} />
      {notificationCount > 0 ? (
        <span className="absolute -right-2 -top-2 bg-accent text-white text-[11px] font-medium w-4 h-4 rounded-full flex items-center justify-center">
          {notificationCount > 99 ? "99+" : notificationCount}
        </span>
      ) : (
        <span className="absolute -right-2 -top-2 bg-primary text-background text-[11px] font-medium w-4 h-4 rounded-full flex items-center justify-center">
          0
        </span>
      )}
    </Link>
  );
};

export default NotificationIcon;
