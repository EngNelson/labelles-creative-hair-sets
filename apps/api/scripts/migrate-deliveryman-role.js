/**
 * Migration Script: Update Deliveryman Role to Employee System
 *
 * This script migrates existing users with role "deliveryman" to the new
 * employee system with role "employee" and employee_role "deliveryman"
 *
 * Run this script once after deploying the new role system
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// User Schema (simplified for migration)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  employee_role: String,
});

const User = mongoose.model("User", userSchema);

// Migration function
const migrateDeliverymanToEmployee = async () => {
  try {

    // Find all deliveryman users
    const deliverymen = await User.find({ role: "deliveryman" });


    if (deliverymen.length === 0) {
      return;
    }

    // Update each deliveryman
    const result = await User.updateMany(
      { role: "deliveryman" },
      {
        $set: {
          role: "employee",
          employee_role: "deliveryman",
        },
      }
    );


    // Verify migration
    const updatedUsers = await User.find({
      role: "employee",
      employee_role: "deliveryman",
    });

      `Found ${updatedUsers.length} users with role=employee and employee_role=deliveryman`
    );

    // Display sample migrated users
    if (updatedUsers.length > 0) {
      updatedUsers.slice(0, 5).forEach((user) => {
          `- ${user.name} (${user.email}): role=${user.role}, employee_role=${user.employee_role}`
        );
      });
    }
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
};

// Rollback function (in case migration needs to be reverted)
const rollbackMigration = async () => {
  try {

    const result = await User.updateMany(
      {
        role: "employee",
        employee_role: "deliveryman",
      },
      {
        $set: { role: "deliveryman" },
        $unset: { employee_role: "" },
      }
    );

  } catch (error) {
    console.error("Rollback failed:", error);
    throw error;
  }
};

// Main execution
const run = async () => {
  await connectDB();

  const args = process.argv.slice(2);
  const command = args[0];

  try {
    if (command === "rollback") {
      await rollbackMigration();
    } else {
      await migrateDeliverymanToEmployee();
    }

    process.exit(0);
  } catch (error) {
    console.error("Migration script failed:", error);
    process.exit(1);
  }
};

// Run the migration
run();

/**
 * Usage:
 *
 * To migrate:
 *   node migrate-deliveryman-role.js
 *
 * To rollback:
 *   node migrate-deliveryman-role.js rollback
 */
