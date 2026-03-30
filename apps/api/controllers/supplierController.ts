// @ts-nocheck
import { Request, Response, NextFunction } from "express"; type RequestHandler = any;
import asyncHandler from "express-async-handler";
import Supplier from "../models/supplierModel.js";

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private/Admin
export const getSuppliers: RequestHandler = asyncHandler(async (req, res) => {
  const page = parseInt((req.query as any).page) || 1;
  const perPage = parseInt((req.query as any).perPage) || 50;
  const search = (req.query as any).search || "";
  const isActive = (req.query as any).isActive;

  const filter: any = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { contact: { $regex: search, $options: "i" } },
    ];
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  const skip = (page - 1) * perPage;

  const suppliers = await Supplier.find(filter)
    .sort({ name: 1 })
    .skip(skip)
    .limit(perPage);

  const total = await Supplier.countDocuments(filter);
  const totalPages = Math.ceil(total / perPage);

  res.json({
    success: true,
    suppliers,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      perPage,
    },
  });
});

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private/Admin
export const getSupplierById: RequestHandler = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    res.status(404);
    throw new Error("Supplier not found");
  }

  res.json({
    success: true,
    supplier,
  });
});

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Private/Admin
export const createSupplier: RequestHandler = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    contact,
    address,
    paymentSystem,
    paymentDetails,
    taxId,
    website,
    notes,
  } = req.body as any;

  if (!name || !email) {
    res.status(400);
    throw new Error("Name and email are required");
  }

  // Check if supplier with email already exists
  const existingSupplier = await Supplier.findOne({ email });
  if (existingSupplier) {
    res.status(400);
    throw new Error("Supplier with this email already exists");
  }

  const supplier = await Supplier.create({
    name,
    email,
    contact,
    address,
    paymentSystem: paymentSystem || "cash",
    paymentDetails,
    taxId,
    website,
    notes,
    createdBy: {
      id: req.user._id,
      name: req.user.name || req.user.email,
    },
  });

  res.status(201).json({
    success: true,
    message: "Supplier created successfully",
    supplier,
  });
});

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private/Admin
export const updateSupplier: RequestHandler = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    res.status(404);
    throw new Error("Supplier not found");
  }

  const {
    name,
    email,
    contact,
    address,
    paymentSystem,
    paymentDetails,
    taxId,
    website,
    notes,
    isActive,
  } = req.body as any;

  // Check if email is being changed and if it already exists
  if (email && email !== supplier.email) {
    const existingSupplier = await Supplier.findOne({ email });
    if (existingSupplier) {
      res.status(400);
      throw new Error("Supplier with this email already exists");
    }
  }

  supplier.name = name || supplier.name;
  supplier.email = email || supplier.email;
  supplier.contact = contact !== undefined ? contact : supplier.contact;
  supplier.address = address !== undefined ? address : supplier.address;
  supplier.paymentSystem = paymentSystem || supplier.paymentSystem;
  supplier.paymentDetails =
    paymentDetails !== undefined ? paymentDetails : supplier.paymentDetails;
  supplier.taxId = taxId !== undefined ? taxId : supplier.taxId;
  supplier.website = website !== undefined ? website : supplier.website;
  supplier.notes = notes !== undefined ? notes : supplier.notes;
  supplier.isActive = isActive !== undefined ? isActive : supplier.isActive;

  const updatedSupplier = await supplier.save();

  res.json({
    success: true,
    message: "Supplier updated successfully",
    supplier: updatedSupplier,
  });
});

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private/Admin
export const deleteSupplier: RequestHandler = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    res.status(404);
    throw new Error("Supplier not found");
  }

  await Supplier.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: "Supplier deleted successfully",
  });
});
