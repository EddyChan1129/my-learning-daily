const CLOUDINARY_EMOJI_FOLDER = "learning/emoj";

export const CLOUDINARY_EMOJIS = [
  { label: "smile", publicId: "smile" },
  { label: "sad", publicId: "sad" },
  { label: "omg", publicId: "omg" },
  { label: "think", publicId: "think" },
];

export function cloudinaryLearningFolder(username: string, postId: string) {
  const safeUsername =
    username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "user";

  return `learning/${safeUsername}/${postId}`;
}

export function cloudinaryEmojiUrl(publicId: string) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return "";

  return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
}

export function cloudinaryLearningFolderFromUrl(url: string | null, postId: string) {
  if (!url) return null;

  const [, path] = url.split("/upload/");
  const publicPath = path?.replace(/^v\d+\//, "");
  const parts = publicPath?.split("/") ?? [];
  const postIdIndex = parts.indexOf(postId);

  if (postIdIndex < 0) {
    return parts[0] === "learning" && parts.length > 2
      ? parts.slice(0, -1).join("/")
      : null;
  }

  return parts.slice(0, postIdIndex + 1).join("/");
}

export function cloudinaryPublicIdFromUrl(url: string | null) {
  if (!url || !url.includes("/upload/")) return null;

  const [, path] = url.split("/upload/");
  const publicPath = path?.replace(/^v\d+\//, "").replace(/\.[^/.]+$/, "");

  return publicPath ? decodeURIComponent(publicPath) : null;
}

export function cloudinaryPublicIdsFromContent(content: string) {
  return Array.from(content.matchAll(/src=["']([^"']+)["']/g))
    .map((match) => cloudinaryPublicIdFromUrl(match[1]))
    .filter(
      (publicId): publicId is string =>
        Boolean(publicId) &&
        !CLOUDINARY_EMOJIS.some(
          (emoji) =>
            publicId === emoji.publicId ||
            publicId === `${CLOUDINARY_EMOJI_FOLDER}/${emoji.publicId}`,
        ),
    );
}

export async function uploadLearningImage(file: File, folder: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await fetch("/api/cloudinary/upload", {
    body: formData,
    method: "POST",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : (data.error?.message ?? "Image upload failed."),
    );
  }

  return data.secure_url as string;
}

export async function deleteCloudinaryAssets({
  accessToken,
  folders,
  publicIds,
}: {
  accessToken: string;
  folders: string[];
  publicIds: string[];
}) {
  const response = await fetch("/api/cloudinary/folder", {
    body: JSON.stringify({ folders, publicIds }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Cloudinary folder delete failed.");
  }
}
