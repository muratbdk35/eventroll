import { NextResponse } from "next/server";
import { isProduction } from "@/lib/env";
import { localRead, localWrite, usingLocalStorage } from "@/lib/storage";
import { MAX_FILE_BYTES } from "@/lib/uploads";

// DEV ONLY: stands in for R2 presigned URLs when R2 is not configured.
function disabled() {
  return isProduction || !usingLocalStorage;
}

type Ctx = { params: Promise<{ key: string[] }> };

export async function PUT(req: Request, { params }: Ctx) {
  if (disabled()) return new NextResponse(null, { status: 404 });
  const key = (await params).key.join("/");
  const body = Buffer.from(await req.arrayBuffer());
  if (body.length > MAX_FILE_BYTES) {
    return new NextResponse(null, { status: 413 });
  }
  await localWrite(key, body);
  return new NextResponse(null, { status: 200 });
}

export async function GET(_req: Request, { params }: Ctx) {
  if (disabled()) return new NextResponse(null, { status: 404 });
  const key = (await params).key.join("/");
  const data = await localRead(key);
  if (!data) return new NextResponse(null, { status: 404 });
  const type = key.endsWith(".png")
    ? "image/png"
    : key.endsWith(".webp")
      ? "image/webp"
      : key.endsWith(".gif")
        ? "image/gif"
        : "image/jpeg";
  return new NextResponse(new Uint8Array(data), {
    headers: { "Content-Type": type, "Cache-Control": "private, max-age=300" },
  });
}
