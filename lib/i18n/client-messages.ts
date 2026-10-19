import "server-only";
import { getMessages } from "next-intl/server";

/*
 * Only the translations a section's client components use are sent to the
 * browser (DECISIONS #67). Sending every namespace to every page added about
 * 150 KB of inline data to the landing page. Paths may go one level deep
 * ("Events.share"). Nested NextIntlClientProvider messages replace the
 * parent's, so the shared namespaces are always included.
 */
const SHARED = ["Nav", "App", "ErrorPage", "NotFound"];

type Messages = Record<string, unknown>;

export async function clientMessages(paths: string[]): Promise<Messages> {
  const all = (await getMessages()) as Messages;
  const out: Messages = {};
  for (const path of [...SHARED, ...paths]) {
    const [ns, sub] = path.split(".");
    if (!(ns in all)) continue;
    if (!sub) {
      out[ns] = all[ns];
      continue;
    }
    const from = all[ns] as Messages;
    if (!(sub in from)) continue;
    out[ns] = { ...((out[ns] as Messages) ?? {}), [sub]: from[sub] };
  }
  return out;
}
