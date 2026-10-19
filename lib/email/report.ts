import "server-only";
import { env } from "@/lib/env";
import { sendEmail } from "./send";

/**
 * Tells the operator that a host reported a photo as illegal (DECISIONS #57).
 * Deliberately carries no image and no link to one: the photo is already out
 * of reach, and nobody should open suspected CSAM. Only ids and the reason,
 * enough to pass on to the authorities. Written in Turkish for the owner.
 */
export async function sendReportNotice(r: {
  reason: "csam" | "illegal";
  eventId: string;
  eventName: string;
  ownerEmail: string;
  mediaId: string;
  deviceId: string | null;
  uploadedAt: Date;
  alsoHidden: number;
}) {
  const to = env.SUPPORT_EMAIL;
  const csam = r.reason === "csam";
  const lines = [
    csam
      ? "Bir etkinlik sahibi bir fotoğrafı ÇOCUK İSTİSMARI İÇERİĞİ (CSAM) olarak bildirdi."
      : "Bir etkinlik sahibi bir fotoğrafı yasa dışı içerik olarak bildirdi.",
    "",
    "Fotoğraf otomatik olarak gizlendi; kimse göremiyor ve indiremiyor.",
    csam
      ? `Yükleyen telefon engellendi; aynı telefondan gelen ${r.alsoHidden} fotoğraf daha gizlendi.`
      : "",
    "",
    `Etkinlik: ${r.eventName} (${r.eventId})`,
    `Etkinlik sahibi: ${r.ownerEmail}`,
    `Fotoğraf kaydı: ${r.mediaId}`,
    `Yükleyen cihaz: ${r.deviceId ?? "bilinmiyor"}`,
    `Yüklenme zamanı: ${r.uploadedAt.toISOString()}`,
    "Yükleyenin IP adresi şifreli kayıtlı. Yalnızca yetkililer resmi olarak isterse çıkar: npm run reveal-ip -- <fotoğraf kaydı> (canlı DATABASE_URL ve şifre yöneticindeki IP_ENCRYPTION_KEY ile).",
    "",
    csam
      ? "Yapılacaklar: Fotoğrafı açma, indirme, kimseye iletme. Şüpheyi yetkililere bildir (Almanya: polis, BKA ya da eco / jugendschutz.net şikâyet hattı) ve silme ya da saklama konusunda onların talimatına uy. Fotoğraf, etkinliğin indirme süresi bitince otomatik silinir; saklanması istenirse bundan önce bildirim yap."
      : "Yapılacaklar: Bildirimin nedenini değerlendir; gerekiyorsa yetkililere bildir. Fotoğraf, etkinliğin indirme süresi bitince otomatik silinir.",
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "");
  const text = lines.join("\n");
  const subject = csam
    ? `[ACİL] CSAM bildirimi: ${r.eventName}`
    : `Yasa dışı içerik bildirimi: ${r.eventName}`;
  if (!to) {
    console.error(`[report] SUPPORT_EMAIL is not set.\n${subject}\n${text}`);
    return;
  }
  await sendEmail({
    to,
    subject,
    text,
    html: `<pre style="font:14px/1.5 ui-monospace,Menlo,monospace;white-space:pre-wrap">${text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")}</pre>`,
  });
}
