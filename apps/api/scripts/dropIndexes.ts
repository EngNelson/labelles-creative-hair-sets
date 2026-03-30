import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "apps/api/.env") });

const dropIndexes = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.log("No MONGO_URI found in env");
      process.exit(1);
    }
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) {
      console.log("No db connection");
      process.exit(1);
    }

    try {
      await db.collection("websiteicons").dropIndex("key_1");
      console.log("Dropped key_1 from websiteicons");
    } catch (e: any) {
      console.log("websiteicons index error:", e.message);
    }

    try {
      await db.collection("subscriptions").dropIndex("email_1");
      console.log("Dropped email_1 from subscriptions");
    } catch (e: any) {
      console.log("subscriptions index error:", e.message);
    }

    try {
      await db.collection("componenttypes").dropIndex("isActive_1");
      console.log("Dropped isActive_1 from componenttypes");
    } catch (e: any) {
      console.log("componenttypes index error:", e.message);
    }

    console.log("Finished dropping indexes.");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

dropIndexes();
