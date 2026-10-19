import "server-only";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { env, isProduction } from "@/lib/env";

/**
 * Object storage behind one interface. Cloudflare R2 when configured; outside
 * production a local directory (`.dev-storage`, served by /api/dev-storage) is
 * used so uploads work without any cloud account.
 */
const r2 =
  env.R2_ENDPOINT &&
  env.R2_BUCKET &&
  env.R2_ACCESS_KEY_ID &&
  env.R2_SECRET_ACCESS_KEY
    ? {
        bucket: env.R2_BUCKET,
        client: new S3Client({
          region: "auto",
          endpoint: env.R2_ENDPOINT,
          credentials: {
            accessKeyId: env.R2_ACCESS_KEY_ID,
            secretAccessKey: env.R2_SECRET_ACCESS_KEY,
          },
        }),
      }
    : null;

export const usingLocalStorage = !r2;
if (!r2 && isProduction) throw new Error("R2 storage is not configured.");

const LOCAL_ROOT = path.resolve(process.cwd(), ".dev-storage");

export function localPath(key: string): string {
  const resolved = path.resolve(LOCAL_ROOT, key);
  if (!resolved.startsWith(LOCAL_ROOT + path.sep)) {
    throw new Error("Invalid storage key");
  }
  return resolved;
}

export type PresignedPut = { url: string; headers: Record<string, string> };

/** Size is bound by signing Content-Length (R2 has no POST policy, DECISIONS #8). */
export async function presignPut(opts: {
  key: string;
  contentType: string;
  contentLength: number;
}): Promise<PresignedPut> {
  const headers = { "Content-Type": opts.contentType };
  if (!r2) {
    return { url: `/api/dev-storage/${opts.key}`, headers };
  }
  const url = await getSignedUrl(
    r2.client,
    new PutObjectCommand({
      Bucket: r2.bucket,
      Key: opts.key,
      ContentType: opts.contentType,
      ContentLength: opts.contentLength,
    }),
    { expiresIn: 15 * 60 },
  );
  return { url, headers };
}

export async function presignGet(
  key: string,
  opts: { ttl?: number; filename?: string } = {},
): Promise<string> {
  if (!r2) return `/api/dev-storage/${key}`;
  return getSignedUrl(
    r2.client,
    new GetObjectCommand({
      Bucket: r2.bucket,
      Key: key,
      ...(opts.filename
        ? {
            ResponseContentDisposition: `attachment; filename="${opts.filename.replace(/"/g, "")}"`,
          }
        : {}),
    }),
    { expiresIn: opts.ttl ?? 60 * 60 },
  );
}

export async function headObject(
  key: string,
): Promise<{ size: number; contentType?: string } | null> {
  if (!r2) {
    try {
      return { size: (await stat(localPath(key))).size };
    } catch {
      return null;
    }
  }
  try {
    const res = await r2.client.send(
      new HeadObjectCommand({ Bucket: r2.bucket, Key: key }),
    );
    return { size: res.ContentLength ?? 0, contentType: res.ContentType };
  } catch {
    return null;
  }
}

/** The first `n` bytes of an object (to check what a file really is). */
export async function readHead(
  key: string,
  n = 32,
): Promise<Uint8Array | null> {
  if (!r2) {
    const data = await localRead(key);
    return data ? new Uint8Array(data.subarray(0, n)) : null;
  }
  try {
    const res = await r2.client.send(
      new GetObjectCommand({
        Bucket: r2.bucket,
        Key: key,
        Range: `bytes=0-${n - 1}`,
      }),
    );
    return res.Body ? await res.Body.transformToByteArray() : null;
  } catch {
    return null;
  }
}

export async function deleteObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  if (!r2) {
    await Promise.all(keys.map((k) => rm(localPath(k), { force: true })));
    return;
  }
  for (let i = 0; i < keys.length; i += 1000) {
    await r2.client.send(
      new DeleteObjectsCommand({
        Bucket: r2.bucket,
        Delete: {
          Objects: keys.slice(i, i + 1000).map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    );
  }
}

// ── local backend helpers (used by /api/dev-storage only) ───────────────
export async function localWrite(key: string, data: Buffer) {
  const file = localPath(key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data);
}

export async function localRead(key: string): Promise<Buffer | null> {
  try {
    return await readFile(localPath(key));
  } catch {
    return null;
  }
}
