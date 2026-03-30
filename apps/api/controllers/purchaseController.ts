// @ts-nocheck
import { Request, Response, NextFunction } from "express"; type RequestHandler = any;
import asyncHandler from "express-async-handler";
import Purchase from "../models/purchaseModel.js";
import Product from "../models/productModel.js";

// @desc    Get all purchases
// @route   GET /api/purchases
// @access  Private/Admin
export const getPurchases: RequestHandler = asyncHandler(async (req, res) => {
  const page = parseInt((req.query as any).page) || 1;
  const perPage = parseInt((req.query as any).perPage) || 10;
  const status = (req.query as any).status;
  const sortOrder = (req.query as any).sortOrder === "desc" ? -1 : 1;

  const filter: any = {};
  if (status && status !== "all") {
    filter.status = status;
  }

  const skip = (page - 1) * perPage;

  const purchases = await Purchase.find(filter)
    .populate("items.productId", "name image")
    .populate("createdBy.id", "name email")
    .populate("approvedBy.id", "name email")
    .populate("purchasedBy.id", "name email")
    .populate("receivedBy.id", "name email")
    .sort({ createdAt: sortOrder })
    .skip(skip)
    .limit(perPage);

  const total = await Purchase.countDocuments(filter);
  const totalPages = Math.ceil(total / perPage);

  res.json({
    success: true,
    purchases,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      perPage,
    },
  });
});

// @desc    Get single purchase
// @route   GET /api/purchases/:id
// @access  Private/Admin
export const getPurchaseById: RequestHandler = asyncHandler(async (req, res) => {
  const purchase = await Purchase.findById(req.params.id)
    .populate("items.productId", "name image stock")
    .populate("createdBy.id", "name email")
    .populate("approvedBy.id", "name email")
    .populate("purchasedBy.id", "name email")
    .populate("receivedBy.id", "name email");

  if (!purchase) {
    res.status(404);
    throw new Error("Purchase not found");
  }

  res.json({
    success: true,
    purchase,
  });
});

// @desc    Create purchase requisition
// @route   POST /api/purchases
// @access  Private/Admin
export const createPurchaseRequisition: RequestHandler = asyncHandler(async (req, res) => {
  const { items, supplier, notes, expectedDeliveryDate } = req.body as any;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error("Please add at least one item to the purchase");
  }

  if (!supplier || !supplier.name) {
    res.status(400);
    throw new Error("Supplier information is required");
  }

  // Validate and calculate items
  const processedItems = items.map((item) => {
    if (!item.productId || !item.quantity || !item.purchasePrice) {
      res.status(400);
      throw new Error(
        "Each item must have productId, quantity, and purchasePrice"
      );
    }

    const profitMargin = item.profitMargin || 0;
    const sellingPrice = item.purchasePrice * (1 + profitMargin / 100);
    const totalCost = item.purchasePrice * item.quantity;

    return {
      productId: item.productId,
      productName: item.productName,
      quantity: parseInt(item.quantity),
      purchasePrice: parseFloat(item.purchasePrice),
      profitMargin: parseFloat(profitMargin),
      sellingPrice: parseFloat(sellingPrice.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
    };
  });

  // Generate purchase number
  const count = await Purchase.countDocuments();
  const purchaseNumber = `PO-${String(count + 1).padStart(6, "0")}`;

  const purchase = await Purchase.create({
    purchaseNumber,
    items: processedItems,
    supplier,
    notes: notes || "",
    expectedDeliveryDate: expectedDeliveryDate || null,
    status: "requisition",
    createdBy: {
      id: req.user._id,
      name: req.user.name || req.user.email,
    },
    statusHistory: [
      {
        status: "requisition",
        changedAt: new Date(),
        changedBy: {
          id: req.user._id,
          name: req.user.name || req.user.email,
        },
        notes: "Purchase requisition created",
      },
    ],
  });

  const populatedPurchase = await Purchase.findById(purchase._id)
    .populate("items.productId", "name image")
    .populate("createdBy.id", "name email");

  res.status(201).json({
    success: true,
    message: "Purchase requisition created successfully",
    purchase: populatedPurchase,
  });
});

// @desc    Update purchase status
// @route   PUT /api/purchases/:id/status
// @access  Private/Admin
export const updatePurchaseStatus: RequestHandler = asyncHandler(async (req, res) => {
  const { status, notes } = req.body as any;

  const validStatuses = [
    "requisition",
    "approved",
    "purchased",
    "received",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error("Invalid status");
  }

  const purchase = await Purchase.findById(req.params.id);
  if (!purchase) {
    res.status(404);
    throw new Error("Purchase not found");
  }

  // Validate status transition
  const currentStatus = purchase.status;
  const validTransitions = {
    requisition: ["approved", "cancelled"],
    approved: ["purchased", "cancelled"],
    purchased: ["received", "cancelled"],
    received: [],
    cancelled: [],
  };

  if (!validTransitions[currentStatus].includes(status)) {
    res.status(400);
    throw new Error(`Cannot change status from ${currentStatus} to ${status}`);
  }

  const userName = req.user.name || req.user.email;
  const updateData: any = {
    status,
    $push: {
      statusHistory: {
        status,
        changedAt: new Date(),
        changedBy: {
          id: req.user._id,
          name: userName,
        },
        notes: notes || "",
      },
    },
  };

  // Track who performed each action
  if (status === "approved") {
    updateData.approvedBy = {
      id: req.user._id,
      name: userName,
      at: new Date(),
      notes: notes || "",
    };
  } else if (status === "purchased") {
    updateData.purchasedBy = {
      id: req.user._id,
      name: userName,
      at: new Date(),
      notes: notes || "",
    };
  } else if (status === "received") {
    updateData.receivedBy = {
      id: req.user._id,
      name: userName,
      at: new Date(),
      notes: notes || "",
    };
    updateData.actualDeliveryDate = new Date();

    // Update product stock and pricing when received
    // Stock is accumulated (added to existing stock)
    // Price is updated to the new selling price
    for (const item of purchase.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: { stock: item.quantity }, // Accumulate: old stock + new quantity
          price: item.sellingPrice, // Update to new selling price
          purchasePrice: item.purchasePrice,
          profitMargin: item.profitMargin,
        },
        { new: true }
      );
    }
  }

  const updatedPurchase = await Purchase.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  )
    .populate("items.productId", "name image stock")
    .populate("createdBy.id", "name email")
    .populate("approvedBy.id", "name email")
    .populate("purchasedBy.id", "name email")
    .populate("receivedBy.id", "name email");

  res.json({
    success: true,
    message: `Purchase ${status} successfully`,
    purchase: updatedPurchase,
  });
});

// @desc    Update purchase
// @route   PUT /api/purchases/:id
// @access  Private/Admin
export const updatePurchase: RequestHandler = asyncHandler(async (req, res) => {
  const purchase = await Purchase.findById(req.params.id);

  if (!purchase) {
    res.status(404);
    throw new Error("Purchase not found");
  }

  // Only allow updates if status is requisition
  if (purchase.status !== "requisition") {
    res.status(400);
    throw new Error("Can only update purchase in requisition status");
  }

  const { items, supplier, notes, expectedDeliveryDate } = req.body as any;

  if (items && items.length > 0) {
    const processedItems = items.map((item) => {
      const profitMargin = item.profitMargin || 0;
      const sellingPrice = item.purchasePrice * (1 + profitMargin / 100);
      const totalCost = item.purchasePrice * item.quantity;

      return {
        productId: item.productId,
        productName: item.productName,
        quantity: parseInt(item.quantity),
        purchasePrice: parseFloat(item.purchasePrice),
        profitMargin: parseFloat(profitMargin),
        sellingPrice: parseFloat(sellingPrice.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
      };
    });
    purchase.items = processedItems;
  }

  if (supplier) purchase.supplier = supplier;
  if (notes !== undefined) purchase.notes = notes;
  if (expectedDeliveryDate)
    purchase.expectedDeliveryDate = expectedDeliveryDate;

  await purchase.save();

  const updatedPurchase = await Purchase.findById(purchase._id)
    .populate("items.productId", "name image")
    .populate("createdBy.id", "name email");

  res.json({
    success: true,
    message: "Purchase updated successfully",
    purchase: updatedPurchase,
  });
});

// @desc    Delete purchase
// @route   DELETE /api/purchases/:id
// @access  Private/Admin
export const deletePurchase: RequestHandler = asyncHandler(async (req, res) => {
  const purchase = await Purchase.findById(req.params.id);

  if (!purchase) {
    res.status(404);
    throw new Error("Purchase not found");
  }

  // Only allow deletion if status is requisition or cancelled
  if (purchase.status !== "requisition" && purchase.status !== "cancelled") {
    res.status(400);
    throw new Error(
      "Can only delete purchase in requisition or cancelled status"
    );
  }

  await Purchase.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: "Purchase deleted successfully",
  });
});

// @desc    Get purchase statistics
// @route   GET /api/purchases/stats
// @access  Private/Admin
export const getPurchaseStats: RequestHandler = asyncHandler(async (req, res) => {
  const stats = await Purchase.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" },
      },
    },
  ]);

  const totalPurchases = await Purchase.countDocuments();
  const totalValue = await Purchase.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: "$totalAmount" },
      },
    },
  ]);

  res.json({
    success: true,
    stats: {
      byStatus: stats,
      totalPurchases,
      totalValue: totalValue[0]?.total || 0,
    },
  });
});
