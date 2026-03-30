import { NextRequest, NextResponse } from "next/server";
import { getApiConfig } from "../../../../lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          message: "Authorization header is required",
        },
        { status: 401 }
      );
    }

    const { baseUrl } = getApiConfig();

    // Forward the request to the backend
    const response = await fetch(`${baseUrl}/auth/set-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "Failed to set password",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Set password API route error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
