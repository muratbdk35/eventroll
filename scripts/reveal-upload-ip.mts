/**
 * Decrypts the uploader IP of one photo, for a legal request from the
 * authorities only (DECISIONS #58). Never for anything else.
 *
 *   DATABASE_URL=<production> IP_ENCRYPTION_KEY=<from the password manager> \
 *     npx tsx scripts/reveal-upload-ip.mts <media id>
 *
 * The media id is in the report email ("Fotoğraf kaydı"). Prints the IP and
 * the upload time; nothing is written.
 */
import { neon } from "@neondatabase/serverless";
import { decryptIp } from "../lib/guest/ip.js";

const id = process.argv[2];
const { DATABASE_URL, IP_ENCRYPTION_KEY } = process.env;
if (!id || !DATABASE_URL || !IP_ENCRYPTION_KEY) {
  console.error(
    "Usage: DATABASE_URL=… IP_ENCRYPTION_KEY=… npx tsx scripts/reveal-upload-ip.mts <media id>",
  );
  process.exit(1);
}
const sql = neon(DATABASE_URL);
const [row] = await sql`
  select uploader_ip_enc, created_at, event_id
  from media where id = ${id}`;
if (!row) {
  console.error("No photo with that id.");
  process.exit(1);
}
if (!row.uploader_ip_enc) {
  console.error(
    "No IP stored for this photo (deleted, or uploaded before IPs were kept).",
  );
  process.exit(1);
}
const ip = decryptIp(row.uploader_ip_enc, IP_ENCRYPTION_KEY);
if (!ip) {
  console.error("Could not decrypt: wrong IP_ENCRYPTION_KEY?");
  process.exit(1);
}
console.log(`IP:        ${ip}`);
console.log(`Uploaded:  ${new Date(row.created_at).toISOString()} (UTC)`);
console.log(`Event:     ${row.event_id}`);
