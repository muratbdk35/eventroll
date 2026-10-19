/**
 * Extends how long a reported photo is kept as evidence (DECISIONS #59), when
 * the authorities ask. Without days it only shows the current hold.
 *
 *   DATABASE_URL=<production> npm run hold-report -- <media id> [days]
 *
 * The hold is counted from today: "180" keeps it 180 more days.
 */
import { neon } from "@neondatabase/serverless";

const [id, daysArg] = process.argv.slice(2);
const { DATABASE_URL } = process.env;
if (!id || !DATABASE_URL) {
  console.error(
    "Usage: DATABASE_URL=… npm run hold-report -- <media id> [days]",
  );
  process.exit(1);
}
const sql = neon(DATABASE_URL);
const [row] = await sql`
  select status, report_reason, reported_at, hold_until
  from media where id = ${id}`;
if (!row?.reported_at) {
  console.error("No reported photo with that id.");
  process.exit(1);
}
if (row.status === "deleted") {
  console.error("Too late: the photo was already deleted.");
  process.exit(1);
}
if (daysArg) {
  const days = Number(daysArg);
  if (!Number.isInteger(days) || days < 1 || days > 3650) {
    console.error("Days must be a whole number between 1 and 3650.");
    process.exit(1);
  }
  const [u] = await sql`
    update media set hold_until = now() + make_interval(days => ${days})
    where id = ${id} returning hold_until`;
  row.hold_until = u.hold_until;
}
console.log(`Reason:     ${row.report_reason}`);
console.log(`Reported:   ${new Date(row.reported_at).toISOString()}`);
console.log(`Kept until: ${new Date(row.hold_until).toISOString()}`);
