export function cloudinaryLearningFolder(username: string, postId: string) {
  const safeUsername =
    username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "user";

  return `learning/${safeUsername}/${postId}`;
}

export function cloudinaryLearningFolderFromUrl(url: string | null, postId: string) {
  if (!url) return null;

  const [, path] = url.split("/upload/");
  const publicPath = path?.replace(/^v\d+\//, "");
  const parts = publicPath?.split("/") ?? [];
  const postIdIndex = parts.indexOf(postId);

  if (postIdIndex < 0) return null;

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
    .filter((publicId): publicId is string => Boolean(publicId));
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
  folders,
  publicIds,
}: {
  folders: string[];
  publicIds: string[];
}) {
  const response = await fetch("/api/cloudinary/folder", {
    body: JSON.stringify({ folders, publicIds }),
    headers: { "Content-Type": "application/json" },
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Cloudinary folder delete failed.");
  }
}
