import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Load .env from apps/api since that's where the MongoDB URIs live
dotenv.config({ path: path.resolve(process.cwd(), "apps", "api", ".env") });

const oldUri = process.env.OLDMONGO_URI;
const newUri = process.env.MONGO_URI;

if (!oldUri || !newUri) {
  console.error(
    "Both OLDMONGO_URI and MONGO_URI must be provided in apps/api/.env",
  );
  process.exit(1);
}

// Convert Mongoose collection docs to native DB docs if needed
// But actually going via native MongoDB driver is cleaner
import { MongoClient } from "mongodb";

async function migrate() {
  console.log("Connecting to old database...");
  const oldClient = new MongoClient(oldUri);
  await oldClient.connect();

  console.log("Connecting to new database...");
  const newClient = new MongoClient(newUri);
  await newClient.connect();
  console.log("Connected to both databases!");

  try {
    const oldDb = oldClient.db();
    const newDb = newClient.db();

    const collections = await oldDb.listCollections().toArray();
    console.log(
      `Found ${collections.length} collections in old DB:`,
      collections.map((c) => c.name),
    );

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      if (collectionName.startsWith("system.")) continue;

      console.log(`\nMigrating collection: ${collectionName}`);
      const oldCollection = oldDb.collection(collectionName);
      const newCollection = newDb.collection(collectionName);

      const documents = await oldCollection.find({}).toArray();
      console.log(`Found ${documents.length} documents in ${collectionName}`);

      if (documents.length > 0) {
        await newCollection.deleteMany({});
        console.log(
          `Cleared existing documents in new collection ${collectionName}`,
        );

        await newCollection.insertMany(documents);
        console.log(
          `Successfully inserted ${documents.length} documents into ${collectionName}`,
        );
      } else {
        console.log(`Skipped ${collectionName} as it is empty`);
      }
    }

    console.log("\nMigration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await oldClient.close();
    await newClient.close();
    process.exit(0);
  }
}

migrate();
