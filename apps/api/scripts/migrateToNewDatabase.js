/**
 * Database Migration Script
 * Copies all data from MONGO_URI to NEW_MONGO_URI
 * Source database remains untouched
 */

import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env") });

const SOURCE_URI = process.env.MONGO_URI;
const DESTINATION_URI = process.env.NEW_MONGO_URI;

if (!SOURCE_URI || !DESTINATION_URI) {
  console.error("❌ Missing MONGO_URI or NEW_MONGO_URI in .env file");
  process.exit(1);
}

async function migrateData() {
  let sourceClient = null;
  let destClient = null;

  try {
    console.log("🔌 Connecting to source database...");
    sourceClient = new MongoClient(SOURCE_URI);
    await sourceClient.connect();
    console.log("✅ Connected to source database");

    console.log("🔌 Connecting to destination database...");
    destClient = new MongoClient(DESTINATION_URI);
    await destClient.connect();
    console.log("✅ Connected to destination database");

    // Get the database names from the URIs
    const sourceDbName = new URL(SOURCE_URI.replace("mongodb+srv://", "https://")).pathname.slice(1).split("?")[0];
    const destDbName = new URL(DESTINATION_URI.replace("mongodb+srv://", "https://")).pathname.slice(1).split("?")[0];

    console.log(`\n📊 Source Database: ${sourceDbName}`);
    console.log(`📊 Destination Database: ${destDbName}\n`);

    const sourceDb = sourceClient.db(sourceDbName);
    const destDb = destClient.db(destDbName);

    // Get all collections from source
    const collections = await sourceDb.listCollections().toArray();
    console.log(`📁 Found ${collections.length} collections to migrate:\n`);

    let totalDocuments = 0;

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const sourceCollection = sourceDb.collection(collectionName);
      const destCollection = destDb.collection(collectionName);

      // Get all documents from source
      const documents = await sourceCollection.find({}).toArray();
      const count = documents.length;

      if (count > 0) {
        // Clear destination collection first (to avoid duplicates)
        await destCollection.deleteMany({});
        
        // Insert all documents
        await destCollection.insertMany(documents);
        console.log(`  ✅ ${collectionName}: ${count} documents migrated`);
      } else {
        console.log(`  ⚪ ${collectionName}: 0 documents (empty collection)`);
      }

      totalDocuments += count;
    }

    // Also copy indexes
    console.log("\n📑 Copying indexes...");
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const sourceCollection = sourceDb.collection(collectionName);
      const destCollection = destDb.collection(collectionName);

      const indexes = await sourceCollection.indexes();
      for (const index of indexes) {
        if (index.name !== "_id_") {
          try {
            const { key, ...options } = index;
            delete options.v;
            delete options.ns;
            await destCollection.createIndex(key, options);
            console.log(`  ✅ Created index ${index.name} on ${collectionName}`);
          } catch (error) {
            if (!error.message.includes("already exists")) {
              console.log(`  ⚠️ Could not create index ${index.name} on ${collectionName}: ${error.message}`);
            }
          }
        }
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`🎉 Migration Complete!`);
    console.log(`   Total collections: ${collections.length}`);
    console.log(`   Total documents: ${totalDocuments}`);
    console.log("=".repeat(50));

  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    if (sourceClient) {
      await sourceClient.close();
      console.log("\n🔌 Source connection closed");
    }
    if (destClient) {
      await destClient.close();
      console.log("🔌 Destination connection closed");
    }
  }
}

// Run the migration
migrateData();
