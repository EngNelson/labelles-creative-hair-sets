import { RequestHandler } from "express";
import asyncHandler from "express-async-handler";
import { notificationService } from "../services/notificationService.js";
import User from "../models/userModel.js";
import {
  RequestWithQuery,
  RequestWithBody,
  PaginationQuery,
} from "../types/express.js";

interface NotificationQuery extends PaginationQuery {
  unreadOnly?: string;
}

interface BulkSendBody {
  type: string;
  title: string;
  message: string;
  image?: string;
  actionUrl?: string;
  actionText?: string;
  priority?: "low" | "normal" | "high";
  userIds?: string[];
  targetAudience?: string;
}

interface UserSearchQuery extends PaginationQuery {
  search?: string;
}

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications: RequestHandler = asyncHandler(
  async (req: RequestWithQuery<NotificationQuery>, res) => {
    const { limit = "20", skip = "0", unreadOnly = "false" } = req.query;

    const result = await notificationService.getUserNotifications(
      req.user._id,
      {
        limit: parseInt(limit),
        skip: parseInt(skip),
        unreadOnly: unreadOnly === "true",
      },
    );

    res.json(result);
  },
);

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount: RequestHandler = asyncHandler(async (req, res) => {
  const result = await notificationService.getUserNotifications(req.user._id, {
    limit: 0,
    skip: 0,
    unreadOnly: false,
  });

  res.json({
    count: result.unreadCount,
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead: RequestHandler = asyncHandler(async (req, res) => {
  const notificationId = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;
  const notification = await notificationService.markAsRead(
    notificationId,
    req.user._id,
  );

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  res.json({
    success: true,
    notification,
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead: RequestHandler = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id);

  res.json({
    success: true,
    modifiedCount: result.modifiedCount,
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification: RequestHandler = asyncHandler(
  async (req, res) => {
    const notificationId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const result = await notificationService.deleteNotification(
      notificationId,
      req.user._id,
    );

    if (result.deletedCount === 0) {
      res.status(404);
      throw new Error("Notification not found");
    }

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  },
);

// @desc    Delete all notifications
// @route   DELETE /api/notifications
// @access  Private
export const deleteAllNotifications: RequestHandler = asyncHandler(
  async (req, res) => {
    const result = await notificationService.deleteAllNotifications(
      req.user._id,
    );

    res.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  },
);

// @desc    Create test notification (development only)
// @route   POST /api/notifications/test
// @access  Private
export const createTestNotification: RequestHandler = asyncHandler(
  async (req, res) => {
    const notification = await notificationService.createNotification({
      userId: req.user._id,
      type: "general",
      title: "Test Notification",
      message: "This is a test notification to verify the system is working.",
      metadata: {
        test: true,
        createdAt: new Date().toISOString(),
      },
    });

    res.status(201).json({
      success: true,
      notification,
      message: "Test notification created successfully",
    });
  },
);

// ============ ADMIN ENDPOINTS ============

// @desc    Send bulk notification to users
// @route   POST /api/notifications/admin/bulk-send
// @access  Private/Admin
export const sendBulkNotification: RequestHandler = asyncHandler(
  async (req: RequestWithBody<BulkSendBody>, res) => {
    const {
      type,
      title,
      message,
      image,
      actionUrl,
      actionText,
      priority,
      userIds,
      targetAudience,
    } = req.body;

    // Validate required fields
    if (!type || !title || !message) {
      res.status(400);
      throw new Error("Type, title, and message are required");
    }

    const result = await notificationService.sendBulkNotification({
      type,
      title,
      message,
      image,
      actionUrl,
      actionText,
      priority: priority || "normal",
      senderId: req.user._id,
      userIds,
      targetAudience: targetAudience as "all" | "specific",
    });

    res.status(201).json({
      success: true,
      ...result,
      message: `Notification sent to ${result.count} users successfully`,
    });
  },
);

// @desc    Get all bulk notification sends
// @route   GET /api/notifications/admin/bulk-sends
// @access  Private/Admin
export const getBulkSends: RequestHandler = asyncHandler(
  async (req: RequestWithQuery<PaginationQuery>, res) => {
    const { limit = "20", skip = "0" } = req.query;

    const result = await notificationService.getBulkSends({
      limit: parseInt(limit),
      skip: parseInt(skip),
    });

    res.json(result);
  },
);

// @desc    Get all users for notification targeting
// @route   GET /api/notifications/admin/users
// @access  Private/Admin
export const getUsersForNotification: RequestHandler = asyncHandler(
  async (req: RequestWithQuery<UserSearchQuery>, res) => {
    const { search = "", limit = "100" } = req.query;

    const query: Record<string, any> = {
      role: { $nin: ["admin", "employee"] },
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("_id name email avatar")
      .limit(parseInt(limit))
      .sort({ name: 1 });

    const totalUsers = await User.countDocuments({
      role: { $nin: ["admin", "employee"] },
    });

    res.json({
      users,
      total: totalUsers,
    });
  },
);

// @desc    Get notification statistics
// @route   GET /api/notifications/admin/stats
// @access  Private/Admin
export const getNotificationStats: RequestHandler = asyncHandler(
  async (req, res) => {
    const Notification = (await import("../models/notificationModel.js"))
      .default;

    const [
      totalSent,
      totalRead,
      bulkSendsCount,
      recentActivity,
      typeDistribution,
    ] = await Promise.all([
      // Total notifications sent
      Notification.countDocuments(),

      // Total read notifications
      Notification.countDocuments({ isRead: true }),

      // Total bulk sends
      Notification.distinct("bulkSendId", { isBulkSent: true }),

      // Recent activity (last 7 days)
      Notification.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]),

      // Notification type distribution
      Notification.aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]),
    ]);

    res.json({
      totalSent,
      totalRead,
      readRate: totalSent > 0 ? ((totalRead / totalSent) * 100).toFixed(2) : 0,
      bulkSendsCount: bulkSendsCount.length,
      recentActivity,
      typeDistribution,
    });
  },
);
