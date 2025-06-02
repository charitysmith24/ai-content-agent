import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getConvexClient } from "@/lib/convex";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storageId = searchParams.get("storageId");
  const userId = searchParams.get("userId");

  console.log("📥 GET /api/get-image-url", { storageId, userId });

  if (!storageId || !userId) {
    console.error("⚠️ Missing required params", { storageId, userId });
    return NextResponse.json(
      { error: "Missing storageId or userId" },
      { status: 400 }
    );
  }

  try {
    const convexClient = getConvexClient();
    console.log("🔍 Fetching URL for storage ID:", storageId);
    
    // Use the images API to get the URL
    const url = await convexClient.query(api.images.getStorageUrl, {
      storageId: storageId as Id<"_storage">,
      userId,
    });

    console.log("✅ Image URL retrieved:", url ? "success" : "not found");

    if (!url) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("❌ Error getting image URL:", error);
    return NextResponse.json(
      { error: "Failed to get image URL" },
      { status: 500 }
    );
  }
} 