import { NextResponse } from "next/server";
import { getApiConfig } from "../../../../lib/config";

export async function GET() {
  try {
    const { baseUrl } = getApiConfig();

    // Test backend connectivity
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@test.com",
        password: "invalidpassword",
      }),
    });



    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();

      return NextResponse.json({
        success: true,
        message: "Backend is accessible and returning JSON",
        backendUrl: baseUrl,
        backendStatus: response.status,
        backendResponse: data,
      });
    } else {
      const text = await response.text();


      return NextResponse.json(
        {
          success: false,
          message: "Backend is not returning JSON",
          backendUrl: baseUrl,
          backendStatus: response.status,
          backendResponse: text.substring(0, 200),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Health check - Error connecting to backend:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        message: "Cannot connect to backend",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
