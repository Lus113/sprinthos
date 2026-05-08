import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    : null;

export async function ensureStorageBuckets() {
  if (!supabaseAdmin) {
    return;
  }

  for (const bucketName of ["product-images", "blog-images"]) {
    const { error } = await supabaseAdmin.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: "10MB",
      allowedMimeTypes: ["image/*"]
    });

    if (error && !/already exists/i.test(error.message || "")) {
      throw error;
    }
  }
}

export async function uploadFileToBucket({ bucket, contentType, fileBuffer, path }) {
  if (!supabaseAdmin) {
    throw new Error("Supabase Storage не настроен.");
  }

  const { error } = await supabaseAdmin.storage.from(bucket).upload(path, fileBuffer, {
    contentType,
    upsert: false
  });

  if (error) {
    throw error;
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);

  return {
    bucket,
    path,
    publicUrl: data.publicUrl
  };
}

export function parseStorageUrl(url) {
  if (typeof url !== "string") {
    return null;
  }

  const marker = "/storage/v1/object/public/";
  const markerIndex = url.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const storagePath = url.slice(markerIndex + marker.length);
  const [bucket, ...parts] = storagePath.split("/");

  if (!bucket || !parts.length) {
    return null;
  }

  return {
    bucket,
    path: decodeURIComponent(parts.join("/"))
  };
}

export async function removeFilesByUrls(urls = []) {
  if (!supabaseAdmin) {
    return;
  }

  const grouped = new Map();

  for (const url of urls) {
    const parsed = parseStorageUrl(url);

    if (!parsed) {
      continue;
    }

    const current = grouped.get(parsed.bucket) || [];
    current.push(parsed.path);
    grouped.set(parsed.bucket, current);
  }

  for (const [bucket, paths] of grouped.entries()) {
    const { error } = await supabaseAdmin.storage.from(bucket).remove(paths);

    if (error) {
      throw error;
    }
  }
}
