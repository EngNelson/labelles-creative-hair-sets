import { Request, Response, RequestHandler } from "express";
import asyncHandler from "express-async-handler";
import Contact from "../models/contactModel.js";

// @desc    Create a new contact message
// @route   POST /api/contact
// @access  Public
const createContactMessage: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      res.status(400);
      throw new Error("Please provide all required fields");
    }

    const contact = await Contact.create({
      name,
      email,
      subject,
      message,
    });

    if (contact) {
      res.status(201).json({
        success: true,
        data: contact,
        message: "Message sent successfully",
      });
    } else {
      res.status(400);
      throw new Error("Invalid contact data");
    }
  },
);

// @desc    Get all contact messages
// @route   GET /api/contact
// @access  Private/Admin
const getContactMessages: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const contacts = await Contact.find({}).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: contacts,
    });
  },
);

// @desc    Delete a contact message
// @route   DELETE /api/contact/:id
// @access  Private/Admin
const deleteContactMessage: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const contact = await Contact.findById(req.params.id);

    if (contact) {
      await Contact.deleteOne({ _id: contact._id });
      res.json({ success: true, message: "Contact message removed" });
    } else {
      res.status(404);
      throw new Error("Contact message not found");
    }
  },
);

export { createContactMessage, getContactMessages, deleteContactMessage };
