import { cookies } from "next/headers";

/**
 * Verify if a token is valid by calling the API
 * @param token - The authentication token to verify
 * @returns Promise<boolean> - True if token is valid, false otherwise
 */
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/";
    const response = await fetch(`${apiUrl}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    return response.ok;
  } catch (error) {
    console.error("Token verification failed:", error);
    return false;
  }
}

/**
 * Get the authentication token from cookies
 * @returns Promise<string | undefined> - The auth token or undefined if not found
 */
export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("auth_token")?.value;
}

/**
 * Check if the current user is authenticated
 * @returns Promise<boolean> - True if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  if (!token) return false;
  return verifyToken(token);
}
