import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  CloudinaryDeleteError,
  deleteCloudinaryAssets,
} from "@/lib/cloudinary-admin";

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
  try {
    const deleted = await deleteCloudinaryAssets({ folders, publicIds });

    return NextResponse.json({ deleted, ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Cloudinary delete failed.",
      },
      { status: error instanceof CloudinaryDeleteError ? error.status : 500 },
    );
  }
}
