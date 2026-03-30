import { RequestHandler } from "express";
import Seller from "../models/sellerModel.js";
import SellerConfig from "../models/sellerConfigModel.js";
import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import asyncHandler from "express-async-handler";
import uploadService from "../config/uploadService.js";
import { RequestWithBody, RequestWithQuery } from "../types/express.js";

interface SellerBody {
  storeName: string;
  description?: string;
  logo?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

interface CreateSellerAdminBody extends SellerBody {
  userId: string;
  status?: string;
  role?: string;
}

interface UpdateSellerDetailsBody extends SellerBody {
  status?: string;
  role?: string;
}

interface UpdateSellerStatusBody {
  status: string;
}

interface SellerConfigBody {
  sellerEnabled?: boolean;
  defaultCommissionRate?: number;
  minOrderAmount?: number;
  allowSellerRegistration?: boolean;
  requireApproval?: boolean;
  maxProductsPerSeller?: number;
}

interface SellerProductBody {
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  purchasePrice?: number;
  stock: number;
  image: string;
  images?: string[];
  category: string;
  brand: string;
  sku?: string;
  productType?: string[];
  discountPercentage?: number;
}

interface SellerStatusQuery {
  status?: string;
}

// @desc    Register a new seller
// @route   POST /api/sellers
// @access  Private
const registerSeller: RequestHandler = asyncHandler(
  async (req: RequestWithBody<SellerBody>, res) => {
    const {
      storeName,
      description,
      logo,
      contactEmail,
      contactPhone,
      address,
    } = req.body;

    const sellerExists = await Seller.findOne({ userId: req.user._id });

    if (sellerExists) {
      res.status(400);
      throw new Error("User has already applied to be a seller");
    }

    const seller = await Seller.create({
      userId: req.user._id,
      storeName,
      description,
      logo,
      contactEmail,
      contactPhone,
      address,
    });

    if (seller) {
      res.status(201).json({
        success: true,
        data: seller,
        message: "Seller application submitted successfully",
      });
    } else {
      res.status(400);
      throw new Error("Invalid seller data");
    }
  },
);

// @desc    Create a new seller by admin
// @route   POST /api/sellers/create
// @access  Private/Admin
const createSellerByAdmin: RequestHandler = asyncHandler(
  async (req: RequestWithBody<CreateSellerAdminBody>, res) => {
    const {
      userId,
      storeName,
      description,
      logo,
      contactEmail,
      contactPhone,
      address,
      status,
      role,
    } = req.body;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Update user role to seller (or provided role)
    user.role = (role || "seller") as "user" | "admin" | "seller" | "employee";
    await user.save();

    // Check if user already has a seller account
    const sellerExists = await Seller.findOne({ userId });
    if (sellerExists) {
      res.status(400);
      throw new Error("This user already has a seller account");
    }

    // Handle logo image upload to Cloudinary if provided
    let logoUrl = "";
    if (logo) {
      const result = await uploadService.uploadImage(logo, {
        folder: "sellers",
        originalName: `seller_${storeName.replace(/\s+/g, "_").toLowerCase()}.jpg`,
      });
      logoUrl = result.url;
    }

    // Create seller with provided status or default to approved for admin creation
    const seller = await Seller.create({
      userId,
      storeName,
      description,
      logo: logoUrl || undefined,
      contactEmail,
      contactPhone,
      address,
      status: (status || "approved") as "pending" | "approved" | "rejected", // Admin-created sellers are approved by default
    });

    // Populate userId for response
    await seller.populate("userId", "name email");

    if (seller) {
      res.status(201).json({
        success: true,
        data: seller,
        message: "Seller created successfully by admin",
      });
    } else {
      res.status(400);
      throw new Error("Invalid seller data");
    }
  },
);

// @desc    Get all seller requests
// @route   GET /api/sellers/requests
// @access  Private/Admin
const getSellerRequests: RequestHandler = asyncHandler(
  async (req: RequestWithQuery<SellerStatusQuery>, res) => {
    // Can filter by status if needed query param exists
    const status = req.query.status;
    const filter = status ? { status } : {};

    const sellers = await Seller.find(filter).populate(
      "userId",
      "name email role",
    );

    res.json({
      success: true,
      count: sellers.length,
      sellers: sellers,
      data: sellers,
    });
  },
);

// @desc    Get seller status for current user
// @route   GET /api/sellers/me
// @access  Private
const getMySellerStatus: RequestHandler = asyncHandler(async (req, res) => {
  const seller = await Seller.findOne({ userId: req.user._id });

  if (!seller) {
    // Return null instead of 404 for users without seller profile
    res.json({
      success: true,
      data: null,
      message: "No seller profile found",
    });
    return;
  }

  res.json({
    success: true,
    data: seller,
  });
});

// @desc    Update seller status
// @route   PUT /api/sellers/:id/status
// @access  Private/Admin
const updateSellerStatus: RequestHandler = asyncHandler(
  async (req: RequestWithBody<UpdateSellerStatusBody>, res) => {
    const { status } = req.body;
    const seller = await Seller.findById(req.params.id);

    if (!seller) {
      res.status(404);
      throw new Error("Seller not found");
    }

    seller.status = status as "pending" | "approved" | "rejected";
    await seller.save();

    // If approved, update user role to seller
    if (status === "approved") {
      const user = await User.findById(seller.userId);
      if (user) {
        user.role = "seller";
        await user.save();
      }
    } else if (status === "rejected" || status === "pending") {
      // Revert role to user if rejected or pending
      const user = await User.findById(seller.userId);
      if (user && user.role === "seller") {
        user.role = "user";
        await user.save();
      }
    }

    res.json({
      success: true,
      data: seller,
      message: `Seller status updated to ${status}`,
    });
  },
);

// @desc    Get seller configuration
// @route   GET /api/sellers/config
// @access  Private/Admin
const getSellerConfig: RequestHandler = asyncHandler(async (req, res) => {
  let config = await SellerConfig.findOne();

  // If no config exists, create default
  if (!config) {
    config = await SellerConfig.create({
      sellerEnabled: true,
      defaultCommissionRate: 15,
      minOrderAmount: 0,
      allowSellerRegistration: true,
      requireApproval: true,
      maxProductsPerSeller: 1000,
    });
  }

  res.json({
    success: true,
    data: config,
  });
});

// @desc    Update seller details by admin
// @route   PUT /api/sellers/:id
// @access  Private/Admin
const updateSellerDetails: RequestHandler = asyncHandler(
  async (req: RequestWithBody<UpdateSellerDetailsBody>, res) => {
    const {
      storeName,
      description,
      logo,
      contactEmail,
      contactPhone,
      address,
      status,
      role,
    } = req.body;

    const seller = await Seller.findById(req.params.id);

    if (!seller) {
      res.status(404);
      throw new Error("Seller not found");
    }

    // Update user role if provided
    if (role) {
      const user = await User.findById(seller.userId);
      if (user) {
        user.role = role as "user" | "admin" | "seller" | "employee";
        await user.save();
      }
    }

    // Handle logo image upload to Cloudinary if provided and it's base64
    let logoUrl = seller.logo; // Keep existing logo by default

    if (logo && logo !== seller.logo) {
      // If logo is provided and different from current, check if it's base64
      if (logo.startsWith("data:image")) {
        // Replace old image with new one
        const result = await uploadService.replaceImage(logo, seller.logo, {
          folder: "sellers",
          originalName: `seller_${storeName.replace(/\s+/g, "_").toLowerCase()}.jpg`,
        });
        logoUrl = result.url;
      } else {
        // If it's already a URL, use it as-is
        logoUrl = logo;
      }
    }

    // Update seller fields
    seller.storeName = storeName || seller.storeName;
    seller.description = description || seller.description;
    seller.logo = logoUrl;
    seller.contactEmail = contactEmail || seller.contactEmail;
    seller.contactPhone =
      contactPhone !== undefined ? contactPhone : seller.contactPhone;
    seller.address = address || seller.address;
    seller.status = (status || seller.status) as
      | "pending"
      | "approved"
      | "rejected";

    const updatedSeller = await seller.save();
    await updatedSeller.populate("userId", "name email role");

    res.json({
      success: true,
      data: updatedSeller,
      message: "Seller updated successfully",
    });
  },
);

// @desc    Update seller configuration
// @route   PUT /api/sellers/config
// @access  Private/Admin
const updateSellerConfig: RequestHandler = asyncHandler(
  async (req: RequestWithBody<SellerConfigBody>, res) => {
    const {
      sellerEnabled,
      defaultCommissionRate,
      minOrderAmount,
      allowSellerRegistration,
      requireApproval,
      maxProductsPerSeller,
    } = req.body;

    let config = await SellerConfig.findOne();

    if (!config) {
      // Create new config if it doesn't exist
      config = await SellerConfig.create(req.body);
    } else {
      // Update existing config
      config.sellerEnabled = sellerEnabled ?? config.sellerEnabled;
      config.defaultCommissionRate =
        defaultCommissionRate ?? config.defaultCommissionRate;
      config.minOrderAmount = minOrderAmount ?? config.minOrderAmount;
      config.allowSellerRegistration =
        allowSellerRegistration ?? config.allowSellerRegistration;
      config.requireApproval = requireApproval ?? config.requireApproval;
      config.maxProductsPerSeller =
        maxProductsPerSeller ?? config.maxProductsPerSeller;

      await config.save();
    }

    res.json({
      success: true,
      data: config,
      message: "Seller configuration updated successfully",
    });
  },
);

// @desc    Create a new product as seller
// @route   POST /api/sellers/products
// @access  Private (Approved Sellers only)
const createSellerProduct: RequestHandler = asyncHandler(
  async (req: RequestWithBody<SellerProductBody>, res) => {
    const seller = await Seller.findOne({ userId: req.user._id });

    if (!seller) {
      res.status(404);
      throw new Error("Seller not found");
    }

    if (seller.status !== "approved") {
      res.status(403);
      throw new Error("Only approved sellers can create products");
    }

    // Check seller config for max products
    const config = await SellerConfig.findOne();
    if (config && config.maxProductsPerSeller) {
      const productCount = await Product.countDocuments({ seller: seller._id });
      if (productCount >= config.maxProductsPerSeller) {
        res.status(400);
        throw new Error(
          `Maximum product limit reached (${config.maxProductsPerSeller} products)`,
        );
      }
    }

    const {
      name,
      description,
      price,
      purchasePrice,
      stock,
      image,
      images,
      category,
      brand,
      productType,
      discountPercentage,
    } = req.body;

    // Calculate profit margin if purchasePrice is provided
    let profitMargin = 0;
    if (purchasePrice && price) {
      profitMargin = ((price - purchasePrice) / price) * 100;
    }

    const product = await Product.create({
      name,
      description,
      price,
      purchasePrice: purchasePrice || 0,
      profitMargin,
      discountPercentage: discountPercentage || 0,
      stock,
      image,
      images: images || [image],
      category,
      brand,
      productType: (productType as any) || [],
      seller: seller._id,
      approvalStatus: "pending", // Seller products need admin approval
    });

    if (product) {
      res.status(201).json({
        success: true,
        data: product,
        message: "Product submitted successfully. Waiting for admin approval.",
      });
    } else {
      res.status(400);
      throw new Error("Invalid product data");
    }
  },
);

// @desc    Get seller's own products
// @route   GET /api/sellers/products?status=pending
// @access  Private (Seller)
const getSellerProducts: RequestHandler = asyncHandler(
  async (req: RequestWithQuery<SellerStatusQuery>, res) => {
    const seller = await Seller.findOne({ userId: req.user._id });

    if (!seller) {
      res.status(404);
      throw new Error("Seller not found");
    }

    const { status } = req.query;
    const filter: any = { seller: seller._id };

    if (status && status !== "all") {
      filter.approvalStatus = status;
    }

    const products = await Product.find(filter)
      .populate("category", "name")
      .populate("brand", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      products,
    });
  },
);

// @desc    Update seller product
// @route   PUT /api/sellers/products/:id
// @access  Private (Seller - own products only)
const updateSellerProduct: RequestHandler = asyncHandler(
  async (req: RequestWithBody<SellerProductBody>, res) => {
    const seller = await Seller.findOne({ userId: req.user._id });

    if (!seller) {
      res.status(404);
      throw new Error("Seller not found");
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    // Check if product belongs to this seller
    if ((product.seller as any).toString() !== seller._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to update this product");
    }

    // Update fields
    const {
      name,
      description,
      price,
      purchasePrice,
      stock,
      image,
      images,
      category,
      brand,
    } = req.body;

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price !== undefined ? price : product.price;
    product.purchasePrice =
      purchasePrice !== undefined ? purchasePrice : product.purchasePrice;
    product.stock = stock !== undefined ? stock : product.stock;
    product.image = image || product.image;
    product.images = images || product.images;
    product.category = (category as any) || product.category;
    product.brand = (brand as any) || product.brand;

    // Reset to pending if approved product is edited
    if (product.approvalStatus === "approved") {
      product.approvalStatus = "pending";
    }

    const updatedProduct = await product.save();

    res.json({
      success: true,
      data: updatedProduct,
      message: "Product updated successfully. Waiting for admin approval.",
    });
  },
);

// @desc    Delete seller product
// @route   DELETE /api/sellers/products/:id
// @access  Private (Seller - own products only)
const deleteSellerProduct: RequestHandler = asyncHandler(async (req, res) => {
  const seller = await Seller.findOne({ userId: req.user._id });

  if (!seller) {
    res.status(404);
    throw new Error("Seller not found");
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Check if product belongs to this seller
  if (product.seller.toString() !== seller._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this product");
  }

  // Delete associated images
  try {
    // Delete main image
    if (product.image) {
      await uploadService.deleteImage(product.image).catch((err: any) => {
        console.error("Failed to delete main image:", err.message);
      });
    }

    // Delete additional images
    if (product.images && product.images.length > 0) {
      for (const imageUrl of product.images) {
        await uploadService.deleteImage(imageUrl).catch((err: any) => {
          console.error("Failed to delete image:", err.message);
        });
      }
    }
  } catch (error: any) {
    console.error("Error deleting product images:", error.message);
    // Continue with product deletion even if image deletion fails
  }

  await product.deleteOne();

  res.json({
    success: true,
    message: "Product and associated images deleted successfully",
  });
});

// @desc    Get seller dashboard statistics
// @route   GET /api/sellers/dashboard/stats
// @access  Private (Seller)
const getSellerDashboardStats: RequestHandler = asyncHandler(
  async (req, res) => {
    const seller = await Seller.findOne({ userId: req.user._id });

    if (!seller) {
      res.status(404);
      throw new Error("Seller not found");
    }

    // Get product counts
    const totalProducts = await Product.countDocuments({ seller: seller._id });
    const pendingProducts = await Product.countDocuments({
      seller: seller._id,
      approvalStatus: "pending",
    });

    const soldResult = await Product.aggregate([
      { $match: { seller: seller._id } },
      { $group: { _id: null, totalSold: { $sum: "$sold" } } },
    ]);
    const totalSoldItems = soldResult.length > 0 ? soldResult[0].totalSold : 0;

    // Get orders with seller products
    const orders = await Order.find({
      "items.seller": seller._id,
    });

    const totalOrders = orders.length;

    // Platform commission deduction
    const platformCommission =
      Number(process.env.PLATFORM_COMMISSION_PERCENTAGE) || 2;
    const multiplier = (100 - platformCommission) / 100;

    const totalRevenue = orders
      .filter(
        (order) => order.status === "completed" || order.status === "delivered",
      )
      .reduce(
        (sum, order) =>
          sum +
          order.items
            .filter(
              (item: any) => item.seller?.toString() === seller._id.toString(),
            )
            .reduce(
              (itemSum: any, item: any) =>
                itemSum + item.price * item.quantity * multiplier,
              0,
            ),
        0,
      );

    res.json({
      success: true,
      totalProducts,
      pendingProducts,
      totalSoldItems,
      totalOrders,
      totalRevenue,
    });
  },
);

// @desc    Get approved sellers (public)
// @route   GET /api/sellers/approved
// @access  Public
const getApprovedSellers: RequestHandler = asyncHandler(async (req, res) => {
  const sellers = await Seller.find({ status: "approved" }).select(
    "_id storeName logo description",
  );

  res.json(sellers);
});

// @desc    Get seller by ID (Admin)
// @route   GET /api/sellers/:id
// @access  Private/Admin
const getSellerById: RequestHandler = asyncHandler(async (req, res) => {
  const seller = await Seller.findById(req.params.id).populate(
    "userId",
    "name email role",
  );

  if (!seller) {
    res.status(404);
    throw new Error("Seller not found");
  }

  res.json({
    success: true,
    data: seller,
  });
});

export {
  registerSeller,
  createSellerByAdmin,
  getSellerRequests,
  getSellerById,
  getMySellerStatus,
  updateSellerStatus,
  updateSellerDetails,
  getSellerConfig,
  updateSellerConfig,
  createSellerProduct,
  getSellerProducts,
  updateSellerProduct,
  deleteSellerProduct,
  getSellerDashboardStats,
  getApprovedSellers,
};
