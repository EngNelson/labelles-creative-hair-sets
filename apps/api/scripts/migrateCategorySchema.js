/**
 * Migration Script for Category Schema Updates
 *
 * This script updates existing categories to include the new hierarchical fields:
 * - slug: Auto-generated from name
 * - parent: Set to null (root categories)
 * - path: Empty string (root categories)
 * - level: 0 (root level)
 * - order: 0 (default order)
 * - isActive: true (default active)
 * - description: Empty string
 *
 * Run this script once after deploying the new category model
 *
 * Usage: node apps/api/scripts/migrateCategorySchema.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

// Migration function
const migrateCategories = async () => {
  try {

    const Category = mongoose.model("Category");
    const categories = await Category.find({});


    let updated = 0;
    let skipped = 0;
    const slugMap = new Map(); // Track slugs to ensure uniqueness

    for (const category of categories) {
      let needsUpdate = false;
      const updates = {};

      // Generate and ensure unique slug
      if (!category.slug) {
        let slug = generateSlug(category.name);
        let counter = 1;

        // Ensure slug uniqueness
        while (slugMap.has(slug)) {
          slug = `${generateSlug(category.name)}-${counter}`;
          counter++;
        }

        slugMap.set(slug, category._id);
        updates.slug = slug;
        needsUpdate = true;
      } else {
        slugMap.set(category.slug, category._id);
      }

      // Set parent to null if not exists
      if (category.parent === undefined) {
        updates.parent = null;
        needsUpdate = true;
      }

      // Set path to empty string if not exists
      if (category.path === undefined) {
        updates.path = "";
        needsUpdate = true;
      }

      // Set level to 0 if not exists
      if (category.level === undefined) {
        updates.level = 0;
        needsUpdate = true;
      }

      // Set order to 0 if not exists
      if (category.order === undefined) {
        updates.order = 0;
        needsUpdate = true;
      }

      // Set isActive to true if not exists
      if (category.isActive === undefined) {
        updates.isActive = true;
        needsUpdate = true;
      }

      // Set description to empty string if not exists
      if (category.description === undefined) {
        updates.description = "";
        needsUpdate = true;
      }

      if (needsUpdate) {
        await Category.updateOne({ _id: category._id }, { $set: updates });
        updated++;
      } else {
        skipped++;
      }
    }


    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

// Run migration
(async () => {

  await connectDB();
  await migrateCategories();
})();
