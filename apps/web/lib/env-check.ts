/**
 * Validate required environment variables
 * This runs at build time to ensure all necessary env vars are present
 */

const requiredEnvVars = ["NEXT_PUBLIC_API_URL"] as const;

const optionalEnvVars = [
  "API_ENDPOINT",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
] as const;

export function validateEnv() {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Check optional but recommended variables
  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((v) => console.error(`   - ${v}`));
    console.error("\n⚠️  Build will continue but may fail or have issues.");
  }

  if (warnings.length > 0 && process.env.NODE_ENV === "production") {
    console.warn("⚠️  Missing optional environment variables:");
    warnings.forEach((v) => console.warn(`   - ${v}`));
  }

  // Log environment info for debugging

}

// Run validation
if (process.env.NODE_ENV !== "test") {
  validateEnv();
}
