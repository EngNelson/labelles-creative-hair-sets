import { NextRequest, NextResponse } from "next/server";
import { getApiConfig } from "../../../../lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { baseUrl } = getApiConfig();


    // Forward the OAuth request to the backend
    const response = await fetch(`${baseUrl}/api/auth/oauth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });



    // Check content type before parsing as JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error(
        "OAuth API route - received non-JSON response:",
        text.substring(0, 500)
      );
      return NextResponse.json(
        {
          success: false,
          message: "Backend returned invalid response format",
        },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "OAuth authentication failed",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("OAuth API route error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
