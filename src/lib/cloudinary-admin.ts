export class CloudinaryDeleteError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function deleteCloudinaryAssets({
  folders,
  publicIds,
}: {
  folders: string[];
  publicIds: string[];
}) {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ??
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const missing = [
    !cloudName && "CLOUDINARY_CLOUD_NAME",
    !apiKey && "CLOUDINARY_API_KEY",
    !apiSecret && "CLOUDINARY_API_SECRET",
    folders.length === 0 && publicIds.length === 0 && "folders or publicIds",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new CloudinaryDeleteError(`Missing ${missing.join(", ")}.`, 400);
  }

  const auth = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
  const baseUrl = `https://api.cloudinary.com/v1_1/${cloudName}`;
  const deleted: Record<string, string> = {};

  for (const folder of folders) {
    if (/%|[^\x20-\x7E]/.test(folder)) continue;

    const prefix = `${folder.replace(/\/$/, "")}/`;
    const deleteResources = await fetch(`${baseUrl}/resources/image/upload`, {
      body: new URLSearchParams({ invalidate: "true", prefix }),
      headers: {
        Authorization: auth,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "DELETE",
    });

    if (!deleteResources.ok) {
      throw new CloudinaryDeleteError(
        await deleteResources.text(),
        deleteResources.status,
      );
    }

    const result = await deleteResources.json();
    Object.assign(deleted, result.deleted);
    if (result.unauthorized?.length) {
      throw new CloudinaryDeleteError(
        "Cloudinary API key is not authorized to delete these assets.",
        403,
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
      throw new CloudinaryDeleteError(
        await deleteFolder.text(),
        deleteFolder.status,
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
    const deleteResources = await fetch(`${baseUrl}/resources/image/upload`, {
      body: deleteParams,
      headers: {
        Authorization: auth,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "DELETE",
    });

    if (!deleteResources.ok) {
      throw new CloudinaryDeleteError(
        await deleteResources.text(),
        deleteResources.status,
      );
    }

    const result = await deleteResources.json();
    Object.assign(deleted, result.deleted);
    if (result.unauthorized?.length) {
      throw new CloudinaryDeleteError(
        "Cloudinary API key is not authorized to delete these assets.",
        403,
      );
    }

    const failedPublicIds = remainingPublicIds.filter(
      (publicId) => deleted[publicId] !== "deleted",
    );
    if (failedPublicIds.length > 0) {
      throw new CloudinaryDeleteError(
        `Cloudinary did not delete: ${failedPublicIds.join(", ")}.`,
        502,
      );
    }
  }

  return deleted;
}
