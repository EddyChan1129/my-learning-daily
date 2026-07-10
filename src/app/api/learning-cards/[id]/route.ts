import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { LearningCard, Profile } from "@/types/learning";
import {
  CloudinaryDeleteError,
  deleteCloudinaryAssets,
} from "@/lib/cloudinary-admin";
import {
  cloudinaryLearningFolder,
  cloudinaryLearningFolderFromUrl,
  cloudinaryPublicIdFromUrl,
  cloudinaryPublicIdsFromContent,
} from "@/utils/cloudinary";
import { learningCardSchema, slugify } from "@/utils/learning";

function getSupabase(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authorization = request.headers.get("authorization");

  if (!url || !anonKey || !authorization) return null;

  return createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
  });
}

async function getUser(supabase: NonNullable<ReturnType<typeof getSupabase>>) {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;

  return data.user;
}

function ownerName(userEmail: string | undefined, profile: Profile | null) {
  return profile?.username ?? userEmail?.split("@")[0] ?? "user";
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = getSupabase(request);
  const user = supabase ? await getUser(supabase) : null;

  if (!supabase || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const input = learningCardSchema.safeParse(await request.json().catch(() => null));

  if (!input.success) {
    return NextResponse.json(
      { error: input.error.issues[0]?.message ?? "Invalid card." },
      { status: 400 },
    );
  }

  const { id } = await params;
  const { data: currentCard, error: currentCardError } = await supabase
    .from("learning_cards")
    .select("*")
    .eq("id", id)
    .single<LearningCard>();

  if (currentCardError || !currentCard) {
    return NextResponse.json(
      { error: currentCardError?.message ?? "Learning card not found." },
      { status: 404 },
    );
  }

  if (currentCard.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("learning_cards")
    .update({
      ...input.data,
      slug: slugify(input.data.title),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ card: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = getSupabase(request);
  const user = supabase ? await getUser(supabase) : null;

  if (!supabase || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const { data: card, error: cardError } = await supabase
    .from("learning_cards")
    .select("*")
    .eq("id", id)
    .single<LearningCard>();

  if (cardError || !card) {
    return NextResponse.json(
      { error: cardError?.message ?? "Learning card not found." },
      { status: 404 },
    );
  }

  if (card.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();
  const folders = Array.from(
    new Set(
      [
        cloudinaryLearningFolder(
          ownerName(user.email, profile),
          card.cloud_id ?? card.id,
        ),
        cloudinaryLearningFolderFromUrl(card.image_url, card.id),
      ].filter((folder): folder is string => Boolean(folder)),
    ),
  );
  const publicIds = Array.from(
    new Set(
      [
        cloudinaryPublicIdFromUrl(card.image_url),
        ...cloudinaryPublicIdsFromContent(card.content),
      ].filter((publicId): publicId is string => Boolean(publicId)),
    ),
  );
  try {
    await deleteCloudinaryAssets({ folders, publicIds });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Cloudinary delete failed.",
      },
      { status: error instanceof CloudinaryDeleteError ? error.status : 500 },
    );
  }

  const { data: deletedCard, error } = await supabase
    .from("learning_cards")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!deletedCard) {
    return NextResponse.json(
      { error: "Supabase did not delete the learning card. Check its DELETE policy." },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true });
}
