import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/productModel.js";

// Load environment variables
dotenv.config();

const generateSlugsForExistingProducts = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      console.error("❌ MONGO_URI environment variable is not set");
      process.exit(1);
    }

    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Get all products without slugs
    const products = await Product.find({ slug: { $exists: false } }).populate(
      "category brand"
    );

    console.log(`Found ${products.length} products without slugs`);

    let updated = 0;
    let failed = 0;

    for (const product of products) {
      try {
        // Trigger the pre-save hook by marking the document as modified
        product.markModified("name");
        await product.save();
        updated++;
        console.log(
          `✅ Generated slug for: ${product.name} -> ${product.slug}`
        );
      } catch (error) {
        failed++;
        console.error(
          `❌ Failed to generate slug for ${product.name}:`,
          error.message
        );
      }
    }

    console.log("\n📊 Summary:");
    console.log(`Total products: ${products.length}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Failed: ${failed}`);

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

generateSlugsForExistingProducts();
