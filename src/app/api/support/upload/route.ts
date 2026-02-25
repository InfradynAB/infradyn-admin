import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
]);

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user as { id?: string; role?: string } | undefined;
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }


    const body = (await request.json()) as {
      fileName?: string;
      contentType?: string;
      fileSize?: number;
    };

    const fileName = body.fileName?.trim();
    const contentType = body.contentType?.trim();
    const fileSize = body.fileSize;

    if (!fileName || !contentType) {
      return NextResponse.json({ error: "fileName and contentType are required" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
    if (typeof fileSize === "number" && fileSize > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const bucket =
      process.env.AWS_S3_BUCKET ||
      process.env.AWS_S3_BUCKET_NAME ||
      process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    if (!bucket || !region) {
      return NextResponse.json(
        {
          error:
            "S3 not configured. Set AWS_REGION and one of AWS_S3_BUCKET, AWS_S3_BUCKET_NAME, or AWS_BUCKET_NAME.",
        },
        { status: 500 }
      );
    }

    const s3 = new S3Client({
      region,
      requestChecksumCalculation: "WHEN_REQUIRED",
    });
    const safeName = sanitizeFilename(fileName);
    const ts = Date.now();
    const key = `support/${user.id}/${ts}_${safeName}`;

    const put = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, put, { expiresIn: 60 });
    const fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key).replace(/%2F/g, "/")}`;

    return NextResponse.json({ uploadUrl, fileUrl, key });
  } catch (error) {
    console.error("[SUPPORT UPLOAD] Error:", error);
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }
}
