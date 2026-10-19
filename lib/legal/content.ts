/**
 * DRAFT legal documents (spec §7.7): placeholders in [brackets] must be filled
 * and every text reviewed by a lawyer before launch. English only for now;
 * German/Turkish versions come from the lawyer (DECISIONS #20).
 *
 * The texts describe what the product actually does (photos only, no shared
 * album, originals stored unchanged, 7-day window, device cookie, salted
 * IP/browser hash). Change them together with the code.
 */
export const legalPages = [
  "privacy",
  "terms",
  "cookies",
  "imprint",
  "dmca-report",
] as const;
export type LegalPage = (typeof legalPages)[number];

/** A paragraph, or a bullet list when the item is an array. */
export type LegalBlock = string | string[];

export type LegalDoc = {
  title: string;
  updated: string;
  intro?: string;
  sections: { heading: string; body: LegalBlock[] }[];
};

export function isLegalPage(value: string): value is LegalPage {
  return (legalPages as readonly string[]).includes(value);
}

const UPDATED = "18 October 2026";

export function getLegalDoc(
  page: LegalPage,
  ctx: { appName: string; supportEmail: string },
): LegalDoc {
  const { appName, supportEmail } = ctx;
  const company = "FeyaTech UG (haftungsbeschränkt)";
  const address = "Pestalozzistraße 25, 22305 Hamburg, Germany";

  const docs: Record<LegalPage, LegalDoc> = {
    privacy: {
      title: "Privacy policy",
      updated: UPDATED,
      intro: `This policy explains which personal data ${appName} processes when you create an event as a host, when you upload photos as a guest, and when you visit our website, why we do it, how long we keep it and which rights you have under the EU General Data Protection Regulation (GDPR).`,
      sections: [
        {
          heading: "1. Who is responsible",
          body: [
            `The controller is ${company}, ${address} ("we", "us"). Email: ${supportEmail}.`,
            "[If appointed: data protection officer, name and contact details.]",
            `For the photos inside an event, the host decides who is invited and what happens to the album. Towards guests, the host is therefore responsible for the album itself; we process the photos on the host's behalf to provide the service. [Lawyer: confirm the role split (Art. 26 / Art. 28 GDPR) and whether a data processing agreement with hosts is needed.]`,
          ],
        },
        {
          heading: "2. Data we process when you are a host",
          body: [
            [
              "Account data: your email address and, if you sign in with Google, your name and profile picture. We use it to create your account and sign you in with a one-time email link or Google. Legal basis: performance of a contract (Art. 6(1)(b) GDPR).",
              "Event data: event name, type, date and times and your settings (for example PIN, upload hours, per-phone limit). Legal basis: Art. 6(1)(b) GDPR.",
              "Payment data: payments are processed by Stripe. We receive the payment status, amount, plan, billing country and invoice details, never your full card number. We keep invoices for the periods required by German commercial and tax law (usually 8 to 10 years). Legal basis: Art. 6(1)(b) and (c) GDPR.",
              "Sign-in security: to protect account creation we use Cloudflare Turnstile, which checks your browser for signs of automation. Legal basis: legitimate interest in preventing abuse (Art. 6(1)(f) GDPR).",
            ],
          ],
        },
        {
          heading: "3. Data we process when you upload as a guest",
          body: [
            "Guests do not need an account. When you open an event link we process:",
            [
              "The photos you choose to send, stored as original files together with a small preview image created in your browser. Original files are stored unchanged, which means embedded metadata (EXIF) such as the date, camera model and, if your phone recorded it, the location where the photo was taken stays in the file the host downloads. You can turn off location tagging in your camera settings before the event.",
              "Your name, only if you enter one.",
              "A random device ID stored in a cookie for this event, so the host's per-phone limit works and the host can block a phone that uploads unwanted content.",
              "A salted, one-way hash of your IP address and browser identifier, used to detect abuse.",
              "Your IP address at the time of the upload, stored encrypted with each photo. It is never shown to the host or used for anything else; we only decrypt it to answer a legal request from the authorities, for example after a report of illegal content. Legal basis: our legitimate interest in being able to help investigate crimes committed through the service, and legal obligations (Art. 6(1)(f) and (c) GDPR).",
              "A Cloudflare Turnstile check and, if the host set one, the PIN you entered (we never store what you type; wrong attempts are rate-limited).",
              "The time you confirmed that you accept the terms and are allowed to share the photos.",
            ],
            "Legal basis: providing the upload to the host you are sending photos to (Art. 6(1)(b) GDPR) and our legitimate interest in keeping the service safe (Art. 6(1)(f) GDPR).",
            "Who sees your photos: only the host of the event. Other guests never see your photos, and albums are not public or indexed by search engines.",
            "We do not look at photos. Storing them, creating previews and the automatic check below happen without anyone viewing them. A person at our company opens a photo only where the law requires it, for example to act on a report of illegal content or on a request from the authorities, or where the host explicitly asks us to for support with specific photos. Any such access is limited to the photos concerned.",
            "Reports: if a host reports a photo as illegal, we record when and why, hide the photo from everyone and are told by email with the event and photo reference, never the image. The reported photo and the data about its upload are then kept, locked and outside the normal deletion, for 90 days as possible evidence, longer only if the authorities ask us to, and then deleted. Where we suspect a crime, in particular child sexual abuse material, we pass the report and the data we hold about the upload on to the competent authorities. Legal basis: our legal obligations and legitimate interest in acting against illegal content (Art. 6(1)(c) and (f) GDPR).",
            "Automatic check for explicit images: a small preview of each photo is checked automatically for explicit sexual content. A photo that is flagged is not deleted; it is kept out of the host's album and downloads, and the host can show it, blurred, to decide whether to keep it. The check does not identify people, and the result is deleted together with the photo. Legal basis: our legitimate interest and the host's in keeping events free of explicit material (Art. 6(1)(f) GDPR).",
          ],
        },
        {
          heading: "4. Visiting our website",
          body: [
            "When you load any page, our hosting provider processes technical data that your browser sends (IP address, date and time, page requested, browser and operating system) to deliver the page and keep it secure. Server logs are deleted after [14] days. Legal basis: Art. 6(1)(f) GDPR.",
            'Product analytics: if enabled, we use PostHog (EU Cloud) to count events such as "event created" or "upload completed". It runs without cookies or local storage, does not record sessions and respects the Do Not Track setting. Legal basis: Art. 6(1)(f) GDPR. [Lawyer: confirm whether consent under § 25 TDDDG is required; once a consent banner exists this will switch to Art. 6(1)(a) GDPR.]',
            "Error monitoring: if an error occurs we send a technical report to Sentry so we can fix it. Reports are configured to avoid personal data where possible. Legal basis: Art. 6(1)(f) GDPR.",
          ],
        },
        {
          heading: "5. How long we keep data",
          body: [
            [
              "Photos and previews: permanently deleted at the end of the download window your plan includes, counted from the day the event ends (7, 14, 21 or 30 days for Mini, Standard, Pro or VIP; 7 days before a plan is chosen). Hosts can delete single photos, all photos from one phone, or the whole event earlier at any time.",
              "Event settings and guest-related records (names, device IDs, hashes, encrypted IP addresses, consent times): deleted together with the photos.",
              "Photos reported as illegal and the data about their upload: kept locked for 90 days as possible evidence, longer only at the request of the authorities, then deleted.",
              "Account data: kept while your account exists and deleted within 30 days after you ask us to delete your account, except data we must keep by law (for example invoices).",
              "Sign-in codes: expire after 10 minutes and are stored only as a hash.",
            ],
          ],
        },
        {
          heading: "6. Service providers and international transfers",
          body: [
            "We only use providers that are bound by a data processing agreement and process data on our instructions:",
            [
              "Vercel Inc. – website hosting (EU region, Frankfurt).",
              "Neon Inc. – database (Frankfurt, Germany).",
              "Cloudflare Inc. – photo storage (R2, EU jurisdiction) and Turnstile bot protection.",
              "Stripe Payments Europe Ltd. – payments and invoices.",
              "Resend Inc. – sending sign-in and service emails.",
              "Upstash Inc. – rate limiting (EU region).",
              "Sightengine SAS (Paris, France) – automatic check of photo previews for explicit content; images are not stored by them after the check. [Lawyer: confirm against their DPA.]",
              "PostHog Inc. – product analytics (EU Cloud).",
              "Functional Software Inc. (Sentry) – error monitoring.",
              'Google Ireland Ltd. – only if you choose "Sign in with Google".',
            ],
            "Some of these companies are based in the United States. Where data may be transferred there, we rely on the EU-US Data Privacy Framework or the EU Standard Contractual Clauses. [Lawyer: confirm the mechanism for each provider.]",
            "We do not sell personal data and do not use your photos for advertising or to train AI models.",
          ],
        },
        {
          heading: "7. Your rights",
          body: [
            "You have the right to access your data (Art. 15 GDPR), to have it corrected (Art. 16), deleted (Art. 17) or restricted (Art. 18), to receive it in a portable format (Art. 20) and to object to processing based on legitimate interests (Art. 21). Where processing is based on consent you can withdraw it at any time with effect for the future.",
            `To use these rights, email ${supportEmail}. If you are a guest and want a photo removed, you can also ask the host directly; please include the event link so we can find it.`,
            "You also have the right to lodge a complaint with a data protection supervisory authority, in particular in the EU country where you live or work or where the alleged infringement took place.",
          ],
        },
        {
          heading: "8. Security",
          body: [
            "All connections are encrypted (HTTPS). Photos are stored in a private bucket and are only delivered through short-lived signed links. Access to production systems is limited to the people who need it, protected by two-factor authentication, and is not used to view photos except as described in section 3.",
          ],
        },
        {
          heading: "9. Children",
          body: [
            "Host accounts are for people aged 18 or over. Guests under 16 should only upload photos with the permission of a parent or guardian.",
          ],
        },
        {
          heading: "10. Changes",
          body: [
            "We update this policy when the service or the law changes. The date at the top shows the current version. If a change affects you significantly, we will tell hosts by email.",
          ],
        },
      ],
    },

    terms: {
      title: "Terms of service",
      updated: UPDATED,
      intro: `These terms apply to the use of ${appName}, operated by ${company}, ${address}. By creating an account or uploading photos you agree to them. Please read them carefully.`,
      sections: [
        {
          heading: "1. The service",
          body: [
            `${appName} lets a host create an event and collect photos from guests through a QR code or link. Guests upload from their phone's browser without an app or account. Only the host sees the photos; guests only see what they uploaded themselves.`,
            "Setting up an event is free. Guests can upload once the host has bought a plan for that event and published it.",
          ],
        },
        {
          heading: "2. Accounts",
          body: [
            "You must be at least 18 years old to create a host account. Keep access to your email account secure, because sign-in links are sent there. You are responsible for activity in your account.",
          ],
        },
        {
          heading: "3. Plans, prices and payment",
          body: [
            [
              "Plans (Mini, Standard, Pro and VIP) are a one-time payment per event, in euros. There is no subscription and nothing renews automatically.",
              "You can move an event to a bigger plan at any time and pay only the difference to the plan you already paid for.",
              "The plan limits (number of photos, storage, features) are shown on the pricing page at the time of purchase.",
              "Prices include statutory VAT. Payment is processed by Stripe; an invoice is issued for every purchase.",
            ],
          ],
        },
        {
          heading: "4. Right of withdrawal for consumers",
          body: [
            "If you are a consumer in the EU you generally have a 14-day right to withdraw from a contract concluded online. Because a plan is a digital service that starts immediately, at checkout we ask you to expressly agree that we begin before the withdrawal period ends and to confirm that you know you lose your right of withdrawal once the service has been fully provided.",
            "Refunds: as long as no photo has been uploaded to the event and the first payment is at most 14 days old, you can cancel the plan in the event settings and get the full amount back; the event goes back to a draft. After photos have been uploaded the service has been provided and there is no automatic refund. If something went wrong on our side, write to us and we will refund in full or in part.",
            "[Lawyer: insert the statutory withdrawal instructions (Widerrufsbelehrung) and model withdrawal form, and confirm the wording at checkout.]",
          ],
        },
        {
          heading: "5. The event window and deletion",
          body: [
            "An event lasts at most 24 hours. All photos are kept until the end of the download window of the chosen plan (7, 14, 21 or 30 days after the event ends for Mini, Standard, Pro or VIP) and are then permanently deleted. It is the host's responsibility to download the album in that time. We send reminders before deletion, but we cannot restore deleted photos.",
          ],
        },
        {
          heading: "6. Rules for hosts",
          body: [
            "As a host you decide who receives the QR code or link. You agree to:",
            [
              "use the service only for real events and not to publish the link in a way that invites strangers to upload;",
              "inform your guests in a suitable way that photos are collected for you (for example on the printed card);",
              "handle the photos you receive in line with data protection law and the rights of the people shown, in particular before publishing them anywhere else;",
              "use the tools we provide (delete, block a phone, PIN, upload hours) if unwanted content is uploaded.",
            ],
          ],
        },
        {
          heading: "7. Rules for guests and for all content",
          body: [
            "Whoever uploads a photo must own it or have the right to share it, and must have the consent of the people shown where the law requires it. It is not allowed to upload:",
            [
              "content that is illegal, including any sexual content involving minors;",
              "content that violates someone else's copyright, privacy or personality rights;",
              "violent, hateful, harassing or pornographic content;",
              "malware or anything that is not a photo.",
            ],
            `By uploading, the guest gives the host the right to keep, download and use the photos for private purposes connected with the event. Guests keep their rights in the photos. To have a photo removed, contact the host or email ${supportEmail}.`,
          ],
        },
        {
          heading: "8. Our rights in the service and in your content",
          body: [
            "We only use photos to provide the service: to store them, create previews and deliver them to the host. We do not claim ownership, do not look at them or show them to anyone else, and do not use them for advertising or AI training. We open a photo only where the law requires it or where the host asks us to for support (see the privacy policy).",
            "We may remove content and suspend events or accounts that break these terms or the law, and we report content involving the sexual abuse of children to the competent authorities.",
            `Reporting illegal content: hosts can report a photo in their album as illegal; it is then removed from view at once, for everyone, and we review the report. Anyone else can report illegal content to ${supportEmail}; please say which event and why. We handle reports promptly and inform the reporter of our decision where we can.`,
          ],
        },
        {
          heading: "9. Availability",
          body: [
            "We work to keep the service available, especially during events, but we cannot guarantee uninterrupted operation, for example during maintenance, network problems at the venue or outages of our providers.",
          ],
        },
        {
          heading: "10. Liability",
          body: [
            "We are liable without limitation for intent and gross negligence, for injury to life, body or health and under the German Product Liability Act. For slight negligence we are only liable for breaches of essential contractual obligations and limited to the damage typical and foreseeable for this kind of contract.",
            "Hosts are responsible for downloading their photos before deletion; we are not liable for photos lost because they were not downloaded in time.",
            "[Lawyer: review this clause under §§ 307 ff. BGB.]",
          ],
        },
        {
          heading: "11. Changes to these terms",
          body: [
            "We may change these terms for future purchases. Changes do not affect plans already bought. Hosts with an account will be informed of material changes by email.",
          ],
        },
        {
          heading: "12. Final provisions",
          body: [
            "German law applies, excluding the UN Convention on Contracts for the International Sale of Goods. If you are a consumer, the mandatory consumer protection rules of the country where you live remain applicable.",
            "If you are a merchant, the place of jurisdiction is [city]. If one provision is invalid, the rest of these terms remain in force.",
            "We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board. [Lawyer: confirm.]",
          ],
        },
      ],
    },

    cookies: {
      title: "Cookie policy",
      updated: UPDATED,
      sections: [
        {
          heading: "Essential cookies",
          body: [
            "We only set cookies that are strictly necessary for the service. They do not require consent:",
            [
              "Sign-in session (hosts): keeps you signed in. Expires when you sign out or after [7] days of inactivity.",
              "Language (NEXT_LOCALE): remembers the language you picked.",
              "Guest device (erg_…): one per event; holds a random device ID and proof that the bot check (and PIN, if any) was passed. The proof lasts 12 hours, the device ID 1 year or until the event is deleted.",
            ],
          ],
        },
        {
          heading: "Analytics",
          body: [
            "Product analytics (PostHog, EU) currently runs without cookies or local storage. If we ever add optional cookies such as advertising measurement, we will only set them after you agree in a cookie banner and you can change your choice at any time.",
          ],
        },
      ],
    },

    imprint: {
      title: "Imprint",
      updated: UPDATED,
      sections: [
        {
          heading: "Information according to § 5 DDG",
          body: [
            company,
            address,
            "Represented by the managing director: Feyza Barutcu",
            "Commercial register: Amtsgericht Hamburg, HRB 186207",
            "[VAT ID (USt-IdNr., DE…) if the company has one; the number on the company website, 43/720/02102, is a tax number and is not shown here.]",
            `Email: ${supportEmail}`,
          ],
        },
        {
          heading: "Consumer dispute resolution",
          body: [
            "We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board. [Lawyer: confirm.]",
          ],
        },
      ],
    },

    "dmca-report": {
      title: "Report content",
      updated: UPDATED,
      sections: [
        {
          heading: "How to report",
          body: [
            `If you find content on ${appName} that is illegal, infringes your rights or shows you without your consent, email ${supportEmail} with:`,
            [
              "the event link (or the name of the event and its date);",
              "a description of the photo, for example who uploaded it and when;",
              "why you believe it is illegal or infringes your rights;",
              "your name and email address, unless you report child sexual abuse material, which can be reported anonymously.",
            ],
            "If you are a guest and want a photo of yourself removed from an album, you can also ask the host directly: hosts can delete any photo at any time.",
          ],
        },
        {
          heading: "What happens next",
          body: [
            "We confirm receipt, review every report promptly and tell you what we decided. Clearly illegal content is removed immediately and the event may be suspended. Content involving the sexual abuse of children is reported to the competent authorities.",
            "[Lawyer: notice-and-action process under the Digital Services Act (Art. 16), statement of reasons to the affected host (Art. 17), copyright notices.]",
          ],
        },
      ],
    },
  };
  return docs[page];
}
