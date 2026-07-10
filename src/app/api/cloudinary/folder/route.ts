import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authorization = request.headers.get("authorization");

  if (!supabaseUrl || !anonKey || !authorization) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ??
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const queryFolder = new URL(request.url).searchParams.get("folder");
  const body = await request.json().catch(() => null);
  const folders: string[] = Array.isArray(body?.folders)
    ? body.folders.filter(
        (folder: unknown): folder is string => typeof folder === "string",
      )
    : queryFolder
      ? [queryFolder]
      : [];
  const publicIds: string[] = Array.isArray(body?.publicIds)
    ? body.publicIds.filter(
        (publicId: unknown): publicId is string =>
          typeof publicId === "string",
      )
    : [];
  const missing = [
    !cloudName && "CLOUDINARY_CLOUD_NAME",
    !apiKey && "CLOUDINARY_API_KEY",
    !apiSecret && "CLOUDINARY_API_SECRET",
    folders.length === 0 && publicIds.length === 0 && "folders or publicIds",
  ].filter(Boolean);

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing ${missing.join(", ")}.` },
      { status: 400 },
    );
  }

  const auth = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
  const baseUrl = `https://api.cloudinary.com/v1_1/${cloudName}`;
  const deleted: Record<string, string> = {};

  for (const folder of folders) {
    if (/%|[^\x20-\x7E]/.test(folder)) continue;

    const prefix = `${folder.replace(/\/$/, "")}/`;
    const deleteParams = new URLSearchParams({ invalidate: "true", prefix });
    const deleteResources = await fetch(
      `${baseUrl}/resources/image/upload`,
      {
        body: deleteParams,
        headers: {
          Authorization: auth,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "DELETE",
      },
    );

    if (!deleteResources.ok) {
      return NextResponse.json(
        { error: await deleteResources.text() },
        { status: deleteResources.status },
      );
    }

    const result = await deleteResources.json();
    Object.assign(deleted, result.deleted);
    if (result.unauthorized?.length) {
      return NextResponse.json(
        { error: "Cloudinary API key is not authorized to delete these assets." },
        { status: 403 },
      );
    }

    const folderPath = folder
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");
    const deleteFolder = await fetch(`${baseUrl}/folders/${folderPath}`, {
      headers: { Authorization: auth },
      method: "DELETE",
    });

    if (!deleteFolder.ok && deleteFolder.status !== 404) {
      return NextResponse.json(
        { error: await deleteFolder.text() },
        { status: deleteFolder.status },
      );
    }
  }

  const remainingPublicIds = publicIds.filter(
    (publicId) => deleted[publicId] !== "deleted",
  );
  if (remainingPublicIds.length > 0) {
    const deleteParams = new URLSearchParams({ invalidate: "true" });
    remainingPublicIds.forEach((publicId) =>
      deleteParams.append("public_ids[]", publicId),
    );
    const deleteResources = await fetch(
      `${baseUrl}/resources/image/upload`,
      {
        body: deleteParams,
        headers: {
          Authorization: auth,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "DELETE",
      },
    );

    if (!deleteResources.ok) {
      return NextResponse.json(
        { error: await deleteResources.text() },
        { status: deleteResources.status },
      );
    }

    const result = await deleteResources.json();
    Object.assign(deleted, result.deleted);
    if (result.unauthorized?.length) {
      return NextResponse.json(
        { error: "Cloudinary API key is not authorized to delete these assets." },
        { status: 403 },
      );
    }

    const failedPublicIds = remainingPublicIds.filter(
      (publicId) => deleted[publicId] !== "deleted",
    );
    if (failedPublicIds.length > 0) {
      return NextResponse.json(
        {
          error: `Cloudinary did not delete: ${failedPublicIds.join(", ")}.`,
          deleted,
        },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ deleted, ok: true });
}
