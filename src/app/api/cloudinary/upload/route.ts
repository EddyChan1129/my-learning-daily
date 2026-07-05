import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const formData = await request.formData();
  const file = formData.get("file");
  const folder = formData.get("folder");
  const missing = [
    !cloudName && "CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
    !apiKey && "CLOUDINARY_API_KEY",
    !apiSecret && "CLOUDINARY_API_SECRET",
    !(file instanceof File) && "file",
    typeof folder !== "string" && "folder",
  ].filter(Boolean);

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing ${missing.join(", ")}.` },
      { status: 400 },
    );
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const publicId = randomUUID();
  const paramsToSign = {
    folder: folder as string,
    public_id: publicId,
    timestamp,
  };
  const signatureBase = Object.entries(paramsToSign)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const signature = createHash("sha1")
    .update(`${signatureBase}${apiSecret}`)
    .digest("hex");

  const uploadForm = new FormData();
  uploadForm.append("file", file as File);
  uploadForm.append("api_key", apiKey as string);
  uploadForm.append("folder", folder as string);
  uploadForm.append("public_id", publicId);
  uploadForm.append("signature", signature);
  uploadForm.append("timestamp", timestamp);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { body: uploadForm, method: "POST" },
  );
  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { error: data.error?.message ?? "Image upload failed." },
      { status: response.status },
    );
  }

  return NextResponse.json({ secure_url: data.secure_url });
}
