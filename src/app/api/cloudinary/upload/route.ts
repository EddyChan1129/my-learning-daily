import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const formData = await request.formData();
  const file = formData.get("file");
  const folder = formData.get("folder");
  const missing = [
    !cloudName && "CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
    !uploadPreset && "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET",
    !(file instanceof File) && "file",
    typeof folder !== "string" && "folder",
  ].filter(Boolean);

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing ${missing.join(", ")}.` },
      { status: 400 },
    );
  }

  const uploadForm = new FormData();
  uploadForm.append("file", file as File);
  uploadForm.append("folder", folder as string);
  uploadForm.append("upload_preset", uploadPreset as string);

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
