// @ts-nocheck
import { Request, Response, NextFunction } from "express"; type RequestHandler = any;
import asyncHandler from "express-async-handler";
import Subscription from "../models/subscriptionModel.js";

// @desc    Subscribe to newsletter
// @route   POST /api/subscriptions/subscribe
// @access  Public
export const subscribe: RequestHandler = asyncHandler(async (req, res) => {
  const { email, source = "other", preferences = {} } = req.body as any;

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error("Invalid email format");
  }

  // Get IP and User Agent for tracking
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get("user-agent");

  // Check if already subscribed
  const existingSubscription = await Subscription.findOne({ email });

  if (existingSubscription) {
    if (existingSubscription.status === "active") {
      return res.status(200).json({
        success: true,
        message: "You are already subscribed to our newsletter",
        subscription: {
          email: existingSubscription.email,
          subscribedAt: existingSubscription.subscribedAt,
        },
      });
    } else {
      // Reactivate unsubscribed user
      existingSubscription.status = "active";
      existingSubscription.unsubscribedAt = null;
      existingSubscription.subscribedAt = new Date();
      existingSubscription.preferences = {
        ...existingSubscription.preferences,
        ...preferences,
      };
      await existingSubscription.save();

      return res.status(200).json({
        success: true,
        message: "Welcome back! Your subscription has been reactivated",
        subscription: {
          email: existingSubscription.email,
          subscribedAt: existingSubscription.subscribedAt,
        },
      });
    }
  }

  // Create new subscription
  const subscription = await Subscription.create({
    email,
    source,
    preferences: {
      newsletter: preferences.newsletter !== false,
      promotions: preferences.promotions !== false,
      newProducts: preferences.newProducts !== false,
    },
    ipAddress,
    userAgent,
  });

  res.status(201).json({
    success: true,
    message: "Successfully subscribed to our newsletter!",
    subscription: {
      email: subscription.email,
      subscribedAt: subscription.subscribedAt,
    },
  });
});

// @desc    Unsubscribe from newsletter
// @route   POST /api/subscriptions/unsubscribe
// @access  Public
export const unsubscribe: RequestHandler = asyncHandler(async (req, res) => {
  const { email } = req.body as any;

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const subscription = await Subscription.findOne({ email });

  if (!subscription) {
    res.status(404);
    throw new Error("Email not found in our subscription list");
  }

  if (subscription.status === "unsubscribed") {
    return res.status(200).json({
      success: true,
      message: "You are already unsubscribed",
    });
  }

  subscription.status = "unsubscribed";
  subscription.unsubscribedAt = new Date();
  await subscription.save();

  res.status(200).json({
    success: true,
    message: "Successfully unsubscribed from newsletter",
  });
});

// @desc    Get all subscriptions (Admin only)
// @route   GET /api/subscriptions
// @access  Private/Admin
export const getSubscriptions: RequestHandler = asyncHandler(async (req, res) => {
  const { status, source, search, page = 1, limit = 20 } = req.query as any;

  const query: any = {};

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by source
  if (source) {
    query.source = source;
  }

  // Search by email
  if (search) {
    query.email = { $regex: search, $options: "i" };
  }

  const skip = (page - 1) * limit;

  const subscriptions = await Subscription.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Subscription.countDocuments(query);

  res.json({
    success: true,
    subscriptions,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get subscription stats (Admin only)
// @route   GET /api/subscriptions/stats
// @access  Private/Admin
export const getSubscriptionStats: RequestHandler = asyncHandler(async (req, res) => {
  const total = await Subscription.countDocuments();
  const active = await Subscription.countDocuments({ status: "active" });
  const unsubscribed = await Subscription.countDocuments({
    status: "unsubscribed",
  });

  // Get count by source
  const modalCount = await Subscription.countDocuments({
    source: "modal",
    status: "active",
  });
  const footerCount = await Subscription.countDocuments({
    source: "footer",
    status: "active",
  });
  const manualCount = await Subscription.countDocuments({
    source: "manual",
    status: "active",
  });

  // Get recent growth (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentGrowth = await Subscription.countDocuments({
    status: "active",
    createdAt: { $gte: thirtyDaysAgo },
  });

  res.json({
    success: true,
    total,
    active,
    unsubscribed,
    modal: modalCount,
    footer: footerCount,
    manual: manualCount,
    recentGrowth,
  });
});

// @desc    Delete subscription (Admin only)
// @route   DELETE /api/subscriptions/:id
// @access  Private/Admin
export const deleteSubscription: RequestHandler = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    res.status(404);
    throw new Error("Subscription not found");
  }

  await subscription.deleteOne();

  res.json({
    success: true,
    message: "Subscription deleted successfully",
  });
});
