/**
 * DRAFT legal documents (spec §7.7): placeholders in [brackets] must be filled
 * and every text reviewed by a lawyer before launch. English only for now;
 * German/Turkish versions come from the lawyer (DECISIONS #20).
 */
export const legalPages = [
  "privacy",
  "terms",
  "cookies",
  "imprint",
  "dmca-report",
] as const;
export type LegalPage = (typeof legalPages)[number];

export type LegalDoc = {
  title: string;
  sections: { heading: string; body: string[] }[];
};

export function isLegalPage(value: string): value is LegalPage {
  return (legalPages as readonly string[]).includes(value);
}

export function getLegalDoc(
  page: LegalPage,
  ctx: { appName: string; supportEmail: string },
): LegalDoc {
  const { appName, supportEmail } = ctx;
  const docs: Record<LegalPage, LegalDoc> = {
    privacy: {
      title: "Privacy policy",
      sections: [
        {
          heading: "Who we are",
          body: [
            `${appName} is operated by [Company name GmbH], [street and number], [postcode] [city], Germany ("we"). Contact: ${supportEmail}.`,
            "[If required: data protection officer, contact details.]",
          ],
        },
        {
          heading: "What we process and why",
          body: [
            "Account data (email address, name, profile image if you sign in with Google) to provide your account. Legal basis: performance of a contract (Art. 6(1)(b) GDPR).",
            "Event data (event name, date, settings) and the photos guests upload, to provide the album to the host. Guests may optionally add a name to their uploads.",
            "Payment data is processed by Stripe; we only receive the payment status, amount and invoice details. Invoices are kept for the period required by German tax law.",
            "To prevent abuse we store a salted, one-way hash of the uploader's IP address and browser, and use Cloudflare Turnstile and rate limiting. Legal basis: legitimate interests (Art. 6(1)(f) GDPR).",
            "Product analytics (PostHog, EU) and marketing pixels are used only after you consent (Art. 6(1)(a) GDPR). You can withdraw consent at any time in the cookie settings.",
          ],
        },
        {
          heading: "Photos and retention",
          body: [
            "Original photos are stored in a private bucket in the EU and are only accessible to the event host. Guests only see reduced previews with location and camera data (EXIF) removed.",
            "All photos of an event are permanently deleted at the end of the 7th day after the event date. Hosts can delete individual photos or the whole event at any time.",
          ],
        },
        {
          heading: "Service providers",
          body: [
            "We use processors bound by data processing agreements: Vercel (hosting, EU region), Neon (database, Frankfurt), Cloudflare (storage, bot protection), Stripe (payments), Resend (email), Upstash (rate limiting), PostHog (analytics, EU) and Sentry (error monitoring).",
            "[Lawyer: confirm transfer mechanisms (EU-US Data Privacy Framework / SCCs) for each provider.]",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "You have the right to access, rectification, erasure, restriction of processing, data portability and to object, and to lodge a complaint with a supervisory authority. Contact us at the address above.",
          ],
        },
      ],
    },
    terms: {
      title: "Terms of service",
      sections: [
        {
          heading: "The service",
          body: [
            `${appName} lets a host create an event and collect photos from guests via a QR code and link. Creating an event is free; guests can upload once the host has purchased a plan for that event.`,
          ],
        },
        {
          heading: "Prices and payment",
          body: [
            "Plans are a one-time payment per event; there is no subscription. Prices include VAT. Payment is processed by Stripe.",
            "[Lawyer: statutory withdrawal right for digital services, consent to immediate performance at checkout.]",
          ],
        },
        {
          heading: "Content",
          body: [
            "Hosts and guests are responsible for the photos they upload and must have the right to share them, including the consent of people shown where required.",
            "Illegal content, content that violates others' rights and sexual content involving minors are prohibited. We remove such content and may suspend events and inform authorities.",
          ],
        },
        {
          heading: "Storage and deletion",
          body: [
            "Photos are available until the end of the 7th day after the event date and are then permanently deleted. Hosts are responsible for downloading their photos in that time.",
          ],
        },
        {
          heading: "Liability and law",
          body: [
            "[Lawyer: limitation of liability under German law.]",
            "German law applies. [Place of jurisdiction.]",
          ],
        },
      ],
    },
    cookies: {
      title: "Cookie policy",
      sections: [
        {
          heading: "Essential cookies",
          body: [
            "We use cookies that are strictly necessary for the service: your sign-in session, your language, and a short-lived session that lets guests upload to an event. These do not require consent.",
          ],
        },
        {
          heading: "Optional cookies",
          body: [
            "Product analytics (PostHog, EU) and advertising measurement (Google Ads, Meta) are only loaded after you agree in the cookie banner. You can change your choice at any time.",
          ],
        },
      ],
    },
    imprint: {
      title: "Imprint",
      sections: [
        {
          heading: "Information according to § 5 DDG",
          body: [
            "[Company name GmbH]",
            "[Street and number], [postcode] [city], Germany",
            "Managing director: [name]",
            "Commercial register: [court], [HRB number]",
            "VAT ID: [DE…]",
            `Email: ${supportEmail}`,
          ],
        },
        {
          heading: "Online dispute resolution",
          body: [
            "[Lawyer: EU ODR platform notice / statement on participation in consumer arbitration (VSBG).]",
          ],
        },
      ],
    },
    "dmca-report": {
      title: "Report content",
      sections: [
        {
          heading: "How to report",
          body: [
            `If you see content that is illegal, violates your rights or shows you without consent, email ${supportEmail} with the event link, a description of the photo and the reason. Guests can also use the "Report" button on any photo in a shared album.`,
          ],
        },
        {
          heading: "What happens next",
          body: [
            "We review every report promptly. Clearly illegal content is removed immediately and the event may be suspended. Content involving the sexual abuse of children is reported to the competent authorities.",
            "[Lawyer: notice-and-action process under the Digital Services Act, copyright notices.]",
          ],
        },
      ],
    },
  };
  return docs[page];
}
