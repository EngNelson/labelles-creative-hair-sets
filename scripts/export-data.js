const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../apps/api/.env") });

// Configuration
// Load MONGO_URI from apps/api/.env or process.env
const MONGO_URI = process.env.MONGO_URI;
const OUTPUT_DIR = path.join(__dirname, "data");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "seed_data.json");

// Collections to export
const COLLECTIONS_TO_EXPORT = [
  "adsbanners",
  "banners",
  "categories",
  "productbanners",
  "products",
  "producttypes",
  "websiteicons",
  "brands",
];

async function exportData() {
  if (!MONGO_URI) {
    console.error(
      "Error: MONGO_URI is not defined in ../apps/api/.env or environment variables.",
    );
    process.exit(1);
  }

  const client = new MongoClient(MONGO_URI);

  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected successfully.");

    const db = client.db(); // Uses the database from the URI
    const allData = {};

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log("Starting export...");

    // Image fields to sanitize per collection
    const IMAGE_FIELDS = {
      products: ["image", "images"],
      categories: ["image"],
      brands: ["image"],
      banners: ["image"],
      adsbanners: ["image"],
      productbanners: ["image"],
      websiteicons: ["imageUrl"],
    };

    const isBase64 = (str) =>
      typeof str === "string" && str.startsWith("data:image");

    for (const collectionName of COLLECTIONS_TO_EXPORT) {
      console.log(`Exporting ${collectionName}...`);
      const collection = db.collection(collectionName);
      let data = await collection.find({}).toArray();

      // Sanitize images
      if (IMAGE_FIELDS[collectionName]) {
        data = data.map((doc) => {
          const fields = IMAGE_FIELDS[collectionName];
          fields.forEach((field) => {
            if (doc[field]) {
              if (Array.isArray(doc[field])) {
                doc[field] = doc[field].map((img) =>
                  isBase64(img) ? "" : img,
                );
              } else if (isBase64(doc[field])) {
                doc[field] = "";
              }
            } else {
              // Ensure field exists as empty string if missing (based on "keep the image as "" empty")
              // Only for non-array fields to match typical schema string types
              if (!Array.isArray(doc[field]) && field !== "images") {
                // Check schema definition? Assuming String for single image fields.
                // However, "doc[field]" is undefined here.
                // Let's set it to "" if it is undefined, to be safe?
                // "if image is not there keep the image as "" empty"
                if (field !== "images") {
                  doc[field] = "";
                } else {
                  doc[field] = [];
                }
              }
            }
          });
          return doc;
        });
      }

      allData[collectionName] = data;
      console.log(`  - Found ${data.length} documents.`);
    }

    console.log(`Writing data to ${OUTPUT_FILE}...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allData, null, 2));
    console.log("Export completed successfully!");
  } catch (error) {
    console.error("Export failed:", error);
  } finally {
    await client.close();
  }
}

exportData();
