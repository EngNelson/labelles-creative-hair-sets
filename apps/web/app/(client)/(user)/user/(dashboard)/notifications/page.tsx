"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount,
  Notification,
} from "@/lib/notificationApi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import NotificationSkeleton from "@/components/common/skeleton/NotificationSkeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Bell,
  Package,
  CreditCard,
  CheckCircle,
  XCircle,
  Truck,
  Trash2,
  Check,
  Eye,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

// Helper function to format time ago
const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;

  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
};

const getNotificationIcon = (type: string): React.ReactElement => {
  const iconProps = { className: "w-5 h-5" };

  switch (type) {
    case "order_placed":
      return React.createElement(Package, {
        ...iconProps,
        className: "w-5 h-5 text-blue-500",
      });
    case "order_confirmed":
      return React.createElement(CheckCircle, {
        ...iconProps,
        className: "w-5 h-5 text-green-500",
      });
    case "order_shipped":
      return React.createElement(Truck, {
        ...iconProps,
        className: "w-5 h-5 text-purple-500",
      });
    case "order_delivered":
      return React.createElement(CheckCircle, {
        ...iconProps,
        className: "w-5 h-5 text-green-600",
      });
    case "order_cancelled":
      return React.createElement(XCircle, {
        ...iconProps,
        className: "w-5 h-5 text-red-500",
      });
    case "payment_success":
      return React.createElement(CreditCard, {
        ...iconProps,
        className: "w-5 h-5 text-green-500",
      });
    case "payment_failed":
      return React.createElement(XCircle, {
        ...iconProps,
        className: "w-5 h-5 text-red-500",
      });
    case "refund_processed":
      return React.createElement(CreditCard, {
        ...iconProps,
        className: "w-5 h-5 text-blue-500",
      });
    default:
      return React.createElement(Bell, {
        ...iconProps,
        className: "w-5 h-5 text-gray-500",
      });
  }
};

export default function NotificationsPage() {
  const router = useRouter();
  const { authUser, auth_token, isAuthenticated, verifyAuth } = useUserStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const ITEMS_PER_PAGE = 10;

  // Verify authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      setAuthLoading(true);
      if (auth_token && !authUser) {
        await verifyAuth();
      }
      setAuthLoading(false);
    };

    checkAuth();
  }, [auth_token, authUser, verifyAuth]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && auth_token) {
      fetchNotifications(auth_token);
    } else if (!authLoading && !isAuthenticated) {
      router.push("/auth/signin");
    }
  }, [authLoading, isAuthenticated, auth_token, router]);

  const fetchNotifications = async (
    authToken: string,
    page: number = 1,
    append: boolean = false
  ) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const data = await getNotifications(authToken, {
        limit: ITEMS_PER_PAGE,
        page,
      });


      if (append) {
        setNotifications((prev) => [...prev, ...data.notifications]);
      } else {
        setNotifications(data.notifications);
      }

      setCurrentPage(data.currentPage);
      setTotalCount(data.totalCount);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("NotificationsPage: Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore && auth_token) {
      fetchNotifications(auth_token, currentPage + 1, true);
    }
  };

  const refreshNotificationCount = useCallback(async () => {
    if (auth_token) {
      try {
        const count = await getUnreadCount(auth_token);
        // Trigger a re-fetch of the notification icon
        window.dispatchEvent(
          new CustomEvent("notificationCountUpdate", { detail: count })
        );
      } catch (error) {
        console.error("Failed to refresh notification count:", error);
      }
    }
  }, [auth_token]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!auth_token) return;
    try {
      await markAsRead(notificationId, auth_token);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      refreshNotificationCount();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!auth_token) return;
    try {
      await markAllAsRead(auth_token);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      refreshNotificationCount();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!auth_token) return;
    try {
      await deleteNotification(notificationId, auth_token);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      refreshNotificationCount();
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleDeleteAll = () => {
    setShowClearDialog(true);
  };

  const confirmDeleteAll = async () => {
    if (!auth_token) return;
    try {
      await deleteAllNotifications(auth_token);
      setNotifications([]);
      setCurrentPage(1);
      setTotalCount(0);
      setHasMore(false);
      setShowClearDialog(false);
      refreshNotificationCount();
    } catch (error) {
      console.error("Failed to delete all notifications:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }

    // Open detail sheet
    setSelectedNotification(notification);
    setIsDetailSheetOpen(true);
  };

  const handleViewDetails = (
    notification: Notification,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.stopPropagation();
    }
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    setSelectedNotification(notification);
    setIsDetailSheetOpen(true);
  };

  const handleRedirect = () => {
    if (!selectedNotification) return;

    setIsDetailSheetOpen(false);

    if (selectedNotification.actionUrl) {
      // Check if external flag is set or if it starts with http
      const isExternal =
        selectedNotification.external ||
        selectedNotification.actionUrl.startsWith("http");

      if (isExternal) {
        window.open(selectedNotification.actionUrl, "_blank");
      } else {
        router.push(selectedNotification.actionUrl);
      }
    } else if (selectedNotification.relatedOrderId) {
      router.push(`/user/orders/${selectedNotification.relatedOrderId}`);
    }
  };

  const getRedirectLabel = () => {
    if (!selectedNotification) return "";

    if (selectedNotification.actionUrl) {
      const isExternal =
        selectedNotification.external ||
        selectedNotification.actionUrl.startsWith("http");

      if (isExternal) {
        return "Open External Link";
      }
      return "View Page";
    } else if (selectedNotification.relatedOrderId) {
      return "View Order Details";
    }
    return "";
  };

  const getRedirectPath = () => {
    if (!selectedNotification) return "";

    if (selectedNotification.actionUrl) {
      return selectedNotification.actionUrl;
    } else if (selectedNotification.relatedOrderId) {
      return `/user/orders/${selectedNotification.relatedOrderId}`;
    }
    return "";
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (authLoading || loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Notifications
            </h2>
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>

        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <NotificationSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Notifications
          </h2>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
          {totalCount > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Showing {notifications.length} of {totalCount} total
            </p>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {React.createElement(Check, { className: "w-4 h-4" })}
                Mark all read
              </Button>
            )}
            <Button
              onClick={handleDeleteAll}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              {React.createElement(Trash2, { className: "w-4 h-4" })}
              Clear all
            </Button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            {React.createElement(Bell, {
              className: "w-16 h-16 text-gray-300 mx-auto mb-4",
            })}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No notifications yet
            </h3>
            <p className="text-gray-600">
              You&apos;ll see updates about your orders and account here
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification._id}
              className={`p-4 transition-all hover:shadow-md ${
                !notification.isRead ? "bg-blue-50 border-blue-200" : "bg-white"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3
                        className={`text-sm font-semibold ${
                          !notification.isRead
                            ? "text-gray-900"
                            : "text-gray-700"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatTimeAgo(new Date(notification.createdAt))}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        onClick={(e) => handleViewDetails(notification, e)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        {React.createElement(Eye, { className: "w-3 h-3" })}
                        <span className="hidden sm:inline">Details</span>
                      </Button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification._id);
                        }}
                        className="shrink-0 p-2 text-gray-400 hover:text-red-600 transition-colors"
                        aria-label="Delete notification"
                      >
                        {React.createElement(Trash2, { className: "w-4 h-4" })}
                      </button>
                    </div>
                  </div>
                  {!notification.isRead && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-xs text-blue-600 font-medium">
                        New
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                className="flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Notification Detail Sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
          <div className="p-6">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <>
                  {selectedNotification &&
                    getNotificationIcon(selectedNotification.type)}
                  Notification Details
                </>
              </SheetTitle>
              <SheetDescription>
                {selectedNotification &&
                  formatTimeAgo(new Date(selectedNotification.createdAt))}
              </SheetDescription>
            </SheetHeader>

            {selectedNotification && (
              <div className="mt-6 space-y-6">
                {/* Notification Image */}
                {selectedNotification.image && (
                  <div className="rounded-lg overflow-hidden border">
                    <img
                      src={selectedNotification.image}
                      alt={selectedNotification.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}

                {/* Title */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {selectedNotification.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        !selectedNotification.isRead
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {!selectedNotification.isRead ? "New" : "Read"}
                    </span>
                    {selectedNotification.priority && (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedNotification.priority === "urgent"
                            ? "bg-red-100 text-red-800"
                            : selectedNotification.priority === "high"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {selectedNotification.priority}
                      </span>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Message
                  </h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {selectedNotification.message}
                  </p>
                </div>

                {/* Metadata */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Information
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Type:</dt>
                      <dd className="text-gray-900 font-medium capitalize">
                        {selectedNotification.type.replace(/_/g, " ")}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Received:</dt>
                      <dd className="text-gray-900">
                        {new Date(
                          selectedNotification.createdAt
                        ).toLocaleString()}
                      </dd>
                    </div>
                    {selectedNotification.relatedOrderId && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Order ID:</dt>
                        <dd className="text-gray-900 font-mono text-xs">
                          {selectedNotification.relatedOrderId}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Action Buttons */}
                <div className="border-t pt-4 space-y-3">
                  {(selectedNotification.actionUrl ||
                    selectedNotification.relatedOrderId) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          {React.createElement(ArrowRight, {
                            className: "w-5 h-5 text-blue-600",
                          })}
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm font-semibold text-blue-900 mb-1">
                            {getRedirectLabel()}
                          </h5>
                          <p className="text-xs text-blue-700 break-all mb-3">
                            {getRedirectPath()}
                          </p>
                          <Button
                            onClick={handleRedirect}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            size="sm"
                          >
                            {selectedNotification.actionText ||
                              getRedirectLabel()}
                            {React.createElement(ExternalLink, {
                              className: "w-4 h-4 ml-2",
                            })}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => setIsDetailSheetOpen(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Clear All Notifications Confirmation Modal */}
      <AlertDialog
        open={showClearDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowClearDialog(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Notifications</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all notifications? This action
              cannot be undone and all notifications will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowClearDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAll}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
