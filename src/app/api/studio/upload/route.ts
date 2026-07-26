import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

/**
 * Token endpoint for client-side uploads.
 *
 * The browser sends the file straight to Blob storage and only asks us for a
 * short-lived token, so a photo from a phone never passes through the function
 * and is not capped by the request body limit.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error: "blob_not_configured",
        message:
          "Image storage is not set up yet. Add BLOB_READ_WRITE_TOKEN to enable photo uploads.",
      },
      { status: 501 },
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
        maximumSizeInBytes: 8 * 1024 * 1024,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {
        // The studio saves the returned URL onto the service itself, so there
        // is nothing to persist here.
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Blob upload error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
