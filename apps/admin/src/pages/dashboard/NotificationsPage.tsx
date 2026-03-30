import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Send,
  Users,
  Image as ImageIcon,
  Calendar,
  Eye,
  Upload,
  Link,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Check,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/config";
import { cn } from "@/lib/utils";

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface NotificationStats {
  totalSent: number;
  totalRead: number;
  readRate: number;
  bulkSendsCount: number;
  recentActivity: Array<{ _id: string; count: number }>;
  typeDistribution: Array<{ _id: string; count: number }>;
}

interface BulkSend {
  _id: string;
  type: string;
  title: string;
  message: string;
  image?: string;
  priority: string;
  targetAudience: string;
  createdAt: string;
  totalSent: number;
  readCount: number;
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [bulkSends, setBulkSends] = useState<BulkSend[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userPerPage] = useState(10);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [imageInputType, setImageInputType] = useState<"upload" | "url">(
    "upload",
  );

  // Inbox State
  const [inboxNotifications, setInboxNotifications] = useState<any[]>([]);
  const [inboxUnread, setInboxUnread] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    type: "announcement",
    title: "",
    message: "",
    image: "",
    actionUrl: "",
    actionText: "",
    external: false,
    priority: "normal",
    targetAudience: "all",
  });

  // Fetch functions
  const fetchStats = async () => {
    try {
      const { data } = await adminApi.get("/notifications/admin/stats");
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchBulkSends = async () => {
    try {
      const { data } = await adminApi.get(
        "/notifications/admin/bulk-sends?limit=20",
      );
      setBulkSends(data.bulkSends);
    } catch (error) {
      console.error("Failed to fetch bulk sends:", error);
    }
  };

  const fetchUsers = useCallback(
    async (search = "", page = 1) => {
      try {
        setLoadingUsers(true);

        const { data } = await adminApi.get("/users", {
          params: {
            page,
            perPage: userPerPage,
            search: search.trim() || undefined,
            role: "user", // Only fetch regular users, not admins/employees
          },
        });

        // Handle paginated response
        if (data.users) {
          setUsers(data.users);
          setTotalUsers(data.total || 0);
        } else {
          setUsers(data || []);
          setTotalUsers(data?.length || 0);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
        if (error && typeof error === "object" && "response" in error) {
          const axiosError = error as {
            response?: { data?: { message?: string }; status?: number };
          };
          console.error("Error response:", axiosError.response?.data);
          console.error("Error status:", axiosError.response?.status);

          // Show toast for better UX
          toast({
            title: "Failed to load users",
            description:
              axiosError.response?.data?.message ||
              "Could not fetch user list. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        setLoadingUsers(false);
      }
    },
    [userPerPage, toast],
  );

  const fetchInbox = useCallback(async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        adminApi.get("/notifications?limit=50"),
        adminApi.get("/notifications/unread-count"),
      ]);
      setInboxNotifications(notifRes.data?.notifications || []);
      setInboxUnread(countRes.data?.count || 0);
    } catch (error) {
      console.error("Failed to fetch inbox:", error);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchStats();
    fetchBulkSends();
    fetchUsers();
    fetchInbox();
  }, [fetchUsers, fetchInbox]);

  // Refetch users when switching to specific audience
  useEffect(() => {
    if (formData.targetAudience === "specific" && users.length === 0) {
      fetchUsers(userSearch, userPage);
    }
  }, [formData.targetAudience, fetchUsers, userSearch, userPage, users.length]);

  const handleSearchUsers = (value: string) => {
    setUserSearch(value);
    setUserPage(1); // Reset to first page when searching
    if (value.length >= 2 || value.length === 0) {
      fetchUsers(value, 1);
    }
  };

  const handleUserPageChange = (newPage: number) => {
    setUserPage(newPage);
    fetchUsers(userSearch, newPage);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        try {
          const base64Image = reader.result as string;

          const { data } = await adminApi.post("/upload/test", {
            image: base64Image,
            folder: "notifications",
          });

          setFormData({ ...formData, image: data.result.url });

          toast({
            title: "Success",
            description: "Image uploaded successfully",
          });
        } catch (error) {
          console.error("Upload error:", error);
          toast({
            title: "Upload Failed",
            description: "Failed to upload image. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsUploadingImage(false);
        }
      };

      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read file",
          variant: "destructive",
        });
        setIsUploadingImage(false);
      };
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image",
        variant: "destructive",
      });
      setIsUploadingImage(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(users.map((u) => u._id));
  };

  const deselectAllUsers = () => {
    setSelectedUsers([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.message) {
      toast({
        title: "Validation Error",
        description: "Title and message are required",
        variant: "destructive",
      });
      return;
    }

    if (formData.targetAudience === "specific" && selectedUsers.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one user",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        userIds: formData.targetAudience === "specific" ? selectedUsers : null,
      };

      const { data } = await adminApi.post(
        "/notifications/admin/bulk-send",
        payload,
      );

      toast({
        title: "Success!",
        description: `Notification sent to ${data.count} users`,
      });

      // Reset form
      setFormData({
        type: "announcement",
        title: "",
        message: "",
        image: "",
        actionUrl: "",
        actionText: "",
        external: false,
        priority: "normal",
        targetAudience: "all",
      });
      setSelectedUsers([]);

      // Refresh data
      fetchStats();
      fetchBulkSends();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Failed to send notification";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      offer: "bg-green-500/10 text-green-700 dark:text-green-300",
      deal: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
      announcement: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
      promotion: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
      alert: "bg-red-500/10 text-red-700 dark:text-red-300",
      admin_message: "bg-[#1a1a2c]/10 text-[#1a1a2c] dark:text-indigo-300",
      general: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
    };
    return colors[type] || colors.general;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-slate-500/10 text-slate-700",
      normal: "bg-blue-500/10 text-blue-700",
      high: "bg-orange-500/10 text-orange-700",
      urgent: "bg-red-500/10 text-red-700",
    };
    return colors[priority] || colors.normal;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-linear-to-br from-[#1a1a2c] to-[#1f2329] rounded-xl">
              <Bell className="h-7 w-7 text-white" />
            </div>
            Notifications
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Send notifications to users and track engagement
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.totalSent.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Read Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.readRate}%
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.totalRead.toLocaleString()} read
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Bulk Sends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.bulkSendsCount}
              </div>
              <p className="text-xs text-slate-500 mt-1">Total campaigns</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {totalUsers.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">Available to notify</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="inbox" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inbox" className="gap-2 relative">
            <Inbox className="h-4 w-4" />
            Inbox
            {inboxUnread > 0 && (
              <Badge className="ml-1 bg-[#d52245] hover:bg-[#d52245]/90 text-white rounded-full px-1.5 py-0.5 text-[10px] min-w-[20px] h-5 flex justify-center items-center">
                {inboxUnread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="send" className="gap-2">
            <Send className="h-4 w-4" />
            Send Notification
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Calendar className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Notifications</CardTitle>
                <CardDescription>
                  Alerts and messages for your admin account
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await adminApi.put("/notifications/read-all");
                    fetchInbox();
                    toast({ title: "All notifications marked as read" });
                    // Find the trigger button in Header and click it optionally, but local state handles it here.
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                <Check className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inboxNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Inbox className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No new notifications</p>
                  </div>
                ) : (
                  inboxNotifications.map((notif: any) => (
                    <div
                      key={notif._id}
                      className={`p-4 border rounded-xl transition-colors ${
                        notif.isRead
                          ? "bg-gray-50 hover:bg-gray-100 border-gray-100"
                          : "bg-[#fbe9ec] hover:bg-[#fbe9ec]/80 border-[#d52245]/20"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h4
                            className={`text-sm ${notif.isRead ? "text-gray-800" : "font-bold text-[#1a1a2c]"}`}
                          >
                            {notif.title}
                          </h4>
                          {notif.message && (
                            <p className="text-sm text-gray-600 mt-1">
                              {notif.message}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDistanceToNow(new Date(notif.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        {!notif.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 text-[#1a1a2c] hover:bg-[#d52245]/10"
                            onClick={async () => {
                              try {
                                await adminApi.put(
                                  `/notifications/${notif._id}/read`,
                                );
                                fetchInbox();
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Send Notification Tab */}
        <TabsContent value="send" className="space-y-6">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Create Notification</CardTitle>
                <CardDescription>
                  Send notifications to all users or select specific users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Notification Type & Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Notification Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="announcement">
                          Announcement
                        </SelectItem>
                        <SelectItem value="offer">Offer</SelectItem>
                        <SelectItem value="deal">Deal</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                        <SelectItem value="alert">Alert</SelectItem>
                        <SelectItem value="admin_message">
                          Admin Message
                        </SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData({ ...formData, priority: value })
                      }
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Flash Sale - 50% Off!"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your notification message here..."
                    rows={4}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Image Upload/URL */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Notification Image (Optional)
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={
                          imageInputType === "upload" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setImageInputType("upload")}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </Button>
                      <Button
                        type="button"
                        variant={
                          imageInputType === "url" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setImageInputType("url")}
                      >
                        <Link className="h-4 w-4 mr-1" />
                        URL
                      </Button>
                    </div>
                  </div>

                  {imageInputType === "upload" ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          id="imageUpload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploadingImage}
                          className="flex-1"
                        />
                        {isUploadingImage && (
                          <div className="text-sm text-slate-500">
                            Uploading...
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Upload an image (max 5MB). Supported formats: JPG, PNG,
                        GIF, WebP
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        id="imageUrl"
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={formData.image}
                        onChange={(e) =>
                          setFormData({ ...formData, image: e.target.value })
                        }
                      />
                      <p className="text-xs text-slate-500">
                        Enter a direct URL to an image
                      </p>
                    </div>
                  )}

                  {formData.image && (
                    <div className="relative rounded-lg overflow-hidden border">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.png";
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData({ ...formData, image: "" })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="actionText">
                      Action Button Text (Optional)
                    </Label>
                    <Input
                      id="actionText"
                      placeholder="e.g., Shop Now"
                      value={formData.actionText}
                      onChange={(e) =>
                        setFormData({ ...formData, actionText: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="actionUrl">
                      Action Button URL (Optional)
                    </Label>
                    <Input
                      id="actionUrl"
                      type="text"
                      placeholder="/shop or https://example.com/offers"
                      value={formData.actionUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, actionUrl: e.target.value })
                      }
                    />
                    <p className="text-xs text-slate-500">
                      Use relative path (/shop, /products) or full URL
                      (https://example.com)
                    </p>
                  </div>
                </div>

                {/* External Link Option */}
                {formData.actionUrl && (
                  <div className="flex items-center space-x-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                    <input
                      type="checkbox"
                      id="external"
                      checked={formData.external}
                      onChange={(e) =>
                        setFormData({ ...formData, external: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-slate-300 text-[#1a1a2c] focus:ring-[#1a1a2c]"
                    />
                    <Label htmlFor="external" className="cursor-pointer">
                      Open link in new tab (external link)
                    </Label>
                  </div>
                )}

                {/* Target Audience */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <Select
                      value={formData.targetAudience}
                      onValueChange={(value) =>
                        setFormData({ ...formData, targetAudience: value })
                      }
                    >
                      <SelectTrigger id="targetAudience">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="specific">Specific Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* User Selection */}
                  {formData.targetAudience === "specific" && (
                    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border-2 border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-semibold">
                            Select Users
                          </Label>
                          <p className="text-sm text-slate-500 mt-1">
                            {selectedUsers.length} of {totalUsers} users
                            selected
                            {users.length === 0 && totalUsers === 0 && (
                              <span className="text-amber-600 ml-2">
                                • Loading users...
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={selectAllUsers}
                            disabled={
                              selectedUsers.length === users.length ||
                              users.length === 0
                            }
                          >
                            Select All
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={deselectAllUsers}
                            disabled={selectedUsers.length === 0}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>

                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Search by name or email..."
                          value={userSearch}
                          onChange={(e) => handleSearchUsers(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* User List */}
                      <div className="border rounded-lg bg-white dark:bg-slate-950">
                        {loadingUsers ? (
                          <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d52245] mx-auto mb-2"></div>
                            <p className="text-sm text-slate-500">
                              Loading users...
                            </p>
                          </div>
                        ) : (
                          <div className="max-h-80 overflow-y-auto space-y-2 p-3">
                            {users.length === 0 ? (
                              <div className="text-center py-8 text-slate-500">
                                {userSearch ? (
                                  <>
                                    <Users className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                                    <p>
                                      No users found matching "{userSearch}"
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <Users className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                                    <p>No users available</p>
                                    <p className="text-xs mt-2">
                                      Check console for errors
                                    </p>
                                  </>
                                )}
                              </div>
                            ) : (
                              users.map((user) => (
                                <label
                                  key={user._id}
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                                    "hover:bg-slate-100 dark:hover:bg-slate-800",
                                    selectedUsers.includes(user._id) &&
                                      "bg-[#fbe9ec] dark:bg-[#1a1a2c] border border-[#d52245]/20 dark:border-indigo-800",
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedUsers.includes(user._id)}
                                    onChange={() =>
                                      toggleUserSelection(user._id)
                                    }
                                    className="h-5 w-5 rounded border-slate-300 text-[#d52245] focus:ring-[#d52245]"
                                  />
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {user.avatar ? (
                                      <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-800"
                                      />
                                    ) : (
                                      <div className="h-10 w-10 rounded-full bg-linear-to-br from-[#1a1a2c] to-[#1f2329] flex items-center justify-center text-white text-sm font-semibold ring-2 ring-white dark:ring-slate-800">
                                        {user.name.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                        {user.name}
                                      </p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                        {user.email}
                                      </p>
                                    </div>
                                    {selectedUsers.includes(user._id) && (
                                      <div className="shrink-0">
                                        <Badge className="bg-indigo-600 text-white">
                                          Selected
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                </label>
                              ))
                            )}
                          </div>
                        )}

                        {/* User Pagination */}
                        {!loadingUsers && totalUsers > userPerPage && (
                          <div className="border-t p-3 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
                            <div className="text-xs text-slate-600">
                              Showing {(userPage - 1) * userPerPage + 1} to{" "}
                              {Math.min(userPage * userPerPage, totalUsers)} of{" "}
                              {totalUsers}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleUserPageChange(userPage - 1)
                                }
                                disabled={userPage === 1}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <div className="flex items-center px-3 text-sm font-medium">
                                {userPage} /{" "}
                                {Math.ceil(totalUsers / userPerPage)}
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleUserPageChange(userPage + 1)
                                }
                                disabled={
                                  userPage >=
                                  Math.ceil(totalUsers / userPerPage)
                                }
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Selection Summary */}
                      {selectedUsers.length > 0 && (
                        <div className="p-3 bg-[#fbe9ec] dark:bg-indigo-950 border border-[#d52245]/20 dark:border-indigo-800 rounded-lg">
                          <p className="text-sm font-medium text-[#1a1a2c] dark:text-indigo-100">
                            <Users className="inline h-4 w-4 mr-1" />
                            You're about to send this notification to{" "}
                            {selectedUsers.length} user
                            {selectedUsers.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        type: "announcement",
                        title: "",
                        message: "",
                        image: "",
                        actionUrl: "",
                        actionText: "",
                        external: false,
                        priority: "normal",
                        targetAudience: "all",
                      });
                      setSelectedUsers([]);
                    }}
                  >
                    Reset
                  </Button>
                  <Button type="submit" disabled={isLoading} className="gap-2">
                    <Send className="h-4 w-4" />
                    {isLoading ? "Sending..." : "Send Notification"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>
                View all previously sent notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bulkSends.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No notifications sent yet</p>
                  </div>
                ) : (
                  bulkSends.map((send) => (
                    <motion.div
                      key={send._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              className={cn("text-xs", getTypeColor(send.type))}
                            >
                              {send.type}
                            </Badge>
                            <Badge
                              className={cn(
                                "text-xs",
                                getPriorityColor(send.priority),
                              )}
                            >
                              {send.priority}
                            </Badge>
                            {send.targetAudience === "all" && (
                              <Badge variant="outline" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                All Users
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                            {send.title}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {send.message}
                          </p>
                          {send.image && (
                            <img
                              src={send.image}
                              alt={send.title}
                              className="w-full max-w-md h-32 object-cover rounded-lg mt-2"
                            />
                          )}
                          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Send className="h-3 w-3" />
                              {send.totalSent} sent
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {send.readCount} read
                            </span>
                            <span>
                              {new Date(send.createdAt).toLocaleDateString()} at{" "}
                              {new Date(send.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
