import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOwnedEvent } from "@/lib/events/queries";
import { guestUrl } from "@/lib/events/urls";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const event = await getOwnedEvent((await params).id, session.user.id);
  if (!event) return new NextResponse(null, { status: 404 });
  // Locked until the event is published, so nobody prints a code for a closed
  // album.
  if (!event.plan) return new NextResponse(null, { status: 402 });
  if (event.status !== "active") {
    return new NextResponse(null, { status: 409 });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format") === "svg" ? "svg" : "png";
  const download = url.searchParams.has("download");
  const link = guestUrl(event);
  const disposition: Record<string, string> = download
    ? {
        "Content-Disposition": `attachment; filename="${event.slug}-qr.${format}"`,
      }
    : {};

  if (format === "svg") {
    const svg = await QRCode.toString(link, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 2,
    });
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "private, no-store",
        ...disposition,
      },
    });
  }
  const png = await QRCode.toBuffer(link, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 1024,
  });
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, no-store",
      ...disposition,
    },
  });
}
