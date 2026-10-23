import type { LegalCtx, LegalDocs } from "./types";

/* English translation of de.ts, for information; the German text is
 * binding (DECISIONS #68). Keep both in step. */

const UPDATED = "23 October 2026";

export function docsEn(c: LegalCtx): LegalDocs {
  const seller = `${c.company}, ${c.address}`;
  const reach = `${seller}, phone: ${c.phone}, email: ${c.supportEmail}`;
  return {
    privacy: {
      title: "Privacy policy",
      updated: UPDATED,
      intro: `This policy explains which personal data ${c.appName} processes when you create an event as a host, upload photos as a guest or visit our website, why, on which legal basis, for how long, and which rights you have under the General Data Protection Regulation (GDPR).`,
      sections: [
        {
          heading: "1. Controller",
          body: [
            `The controller is ${seller} ("we", "us"), represented by its managing director ${c.managingDirector}. Email: ${c.supportEmail}, contact form: ${c.contactUrl}.`,
            "We are not legally required to appoint a data protection officer and have not appointed one.",
            "For the photos inside an event, the host decides who is invited and what happens to the album. Towards guests the host is responsible for the album; we process the photos on the host's behalf to provide the service. If a company uses the service (for example for a corporate event), we conclude a data processing agreement under Art. 28 GDPR on request.",
          ],
        },
        {
          heading: "2. Data of hosts",
          body: [
            [
              "Account data: your email address and, if you sign in with Google, your name and profile picture. We use them to create your account and to sign you in with a one-time code by email or with Google. Legal basis: performance of a contract (Art. 6(1)(b) GDPR).",
              "Event data: name, type, date and time of the event and your settings (for example PIN, per-phone limit, colour of the invitation card). Legal basis: Art. 6(1)(b) GDPR.",
              "Payment data: payments are handled by Stripe. We receive the payment status, amount, plan, billing country and invoice details, never your full card number. We keep invoices for the periods required by German commercial and tax law (usually 8 to 10 years). Legal basis: Art. 6(1)(b) and (c) GDPR.",
              'Order and service emails: order confirmation, invoice, notices about your event (for example "album ready" and reminders before deletion). Legal basis: Art. 6(1)(b) GDPR.',
              "Protection against abuse at sign-in: Cloudflare Turnstile checks your browser for signs of automated access. Legal basis: legitimate interest in preventing abuse (Art. 6(1)(f) GDPR).",
            ],
          ],
        },
        {
          heading: "3. Data of guests",
          body: [
            "Guests do not need an account. When you open an event link and send photos, we process:",
            [
              "the photos you choose, as the original file and a small preview your browser creates. Original files stay unchanged; embedded metadata (EXIF) such as the time taken, camera model and, if your phone recorded it, the location stay in the file the host downloads. You can switch location tagging off in your camera settings before the event. RAW photos are converted in your browser to the JPEG they contain; only that is uploaded;",
              "your name, only if you enter one;",
              "a random device ID in a cookie for this event, so the per-phone limit works and the host can block a phone that uploads unwanted content;",
              "a salted, one-way hash of your IP address and browser identifier, to detect abuse;",
              "the Cloudflare Turnstile check and, if the host set one, the PIN you enter (we do not store what you type; wrong attempts are limited);",
              "the time you confirmed that you accept the terms and may share the photos.",
            ],
            "Legal basis: providing the upload to the host you send photos to (Art. 6(1)(b) GDPR) and our legitimate interest in a safe service (Art. 6(1)(f) GDPR).",
            "Who sees your photos: only the host of the event. Other guests never see your photos; albums are not public and are not indexed by search engines.",
            "We do not look at photos. Storage, previews and the automatic check below run without anyone viewing the photos. A person at our company opens a photo only where the law requires it, for example to act on a report of illegal content or a request from the authorities, or where the host explicitly asks us for support with specific photos. Any such access is limited to the photos concerned.",
            "Automatic check for explicit content (in preparation, not active yet; once it starts, the following applies): a small preview of each photo is checked automatically for explicit sexual content. A flagged photo is not deleted; it is kept out of the host's album and downloads, and the host can show it blurred and decide whether to keep it. The check does not identify people; its result is deleted with the photo. Legal basis: our and the host's legitimate interest in keeping events free of explicit content (Art. 6(1)(f) GDPR).",
            "Reports: if a host reports a photo as illegal, we record when and why, hide the photo from everyone and are told by email with the event and photo reference, never the image. The photo is deleted with the event's other photos at the end of the download window, unless the authorities require us to keep it longer. Where we suspect a crime, in particular child sexual abuse material, we pass the report and the data about the upload to the competent authorities. Legal basis: legal obligations and legitimate interest in acting against illegal content (Art. 6(1)(c) and (f) GDPR).",
          ],
        },
        {
          heading: "4. Visiting our website",
          body: [
            "When you load a page, our hosting provider processes technical data your browser sends (IP address, date and time, page requested, browser and operating system) to deliver and secure the page. These logs are deleted after 30 days at the latest. Legal basis: Art. 6(1)(f) GDPR.",
            "Rate limiting: to prevent abuse we count requests per IP address (for example for uploads, the contact form and PIN entry). For this, the IP address is kept at Upstash for at most one hour and then deleted automatically. Legal basis: Art. 6(1)(f) GDPR.",
            "Contact form: we use your name, email address and message only to answer you and delete them when the matter is settled, at the latest after 12 months. The bot check uses Cloudflare Turnstile. Legal basis: Art. 6(1)(b) and (f) GDPR.",
            `Withdrawal function (${c.withdrawUrl}): we use your name, the order number and your email address to match the withdrawal, confirm its receipt and process it. Legal basis: legal obligation (Art. 6(1)(c) GDPR, § 356a BGB). We keep the details as proof for as long as claims under the contract can be made, at most three years.`,
            "Analytics and error monitoring: we currently use no analytics or error monitoring services. Should we use PostHog (EU Cloud, without cookies) or Sentry in future, we will update this policy first.",
            "Fonts are served from our own server; no data is sent to Google Fonts.",
          ],
        },
        {
          heading: "5. How long we keep data",
          body: [
            [
              "Photos and previews: permanently deleted at the end of your plan's download window, counted from the day the event ends (7, 14, 21 or 30 days for Mini, Standard, Pro or VIP; 7 days while no plan is chosen). Hosts can delete single photos, all photos from one phone or the whole event earlier at any time.",
              "Event settings and guest data (names, device IDs, hashes, consent times): deleted with the photos.",
              "Account data: while your account exists; deleted within 30 days after you ask, except data we must keep by law (for example invoices).",
              "Sign-in codes: valid for 10 minutes, stored only as a hash.",
            ],
          ],
        },
        {
          heading: "6. Recipients and transfers outside the EU",
          body: [
            "We only use providers bound by a data processing agreement who process data on our instructions:",
            [
              "Vercel Inc. – website hosting (EU region Frankfurt);",
              "Neon Inc. – database (Frankfurt);",
              "Cloudflare Inc. – photo storage (R2, EU jurisdiction), bot protection (Turnstile) and email forwarding;",
              "Stripe Payments Europe Ltd. (Ireland) – payments and invoices;",
              "Resend Inc. – sign-in, order and service emails;",
              "Upstash Inc. – rate limiting (EU region);",
              "Sightengine SAS (Paris) – only once the automatic check is active: automatic check of previews for explicit content; images are not stored after the check;",
              'Google Ireland Ltd. – only if you choose "Sign in with Google".',
              "Google Ireland Ltd. (Gmail) – the mailbox that email to our address is forwarded to (contact form, withdrawals, reports, requests).",
            ],
            "Some of these companies are based in the United States. Where data may be transferred there, we rely on the EU-US Data Privacy Framework or the EU Commission's Standard Contractual Clauses.",
            "We do not sell personal data and do not use your photos for advertising or to train AI models.",
          ],
        },
        {
          heading: "7. Your rights",
          body: [
            "You have the right of access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction (Art. 18), data portability (Art. 20) and to object to processing based on legitimate interests (Art. 21). You can withdraw consent at any time with effect for the future.",
            `Write to ${c.supportEmail}. As a guest you can also ask the host directly to delete a photo; please give us the event link so we can find it.`,
            "You also have the right to complain to a data protection supervisory authority, in particular in the EU country where you live or work. Our authority is the Hamburg Commissioner for Data Protection and Freedom of Information.",
            "Whether you must provide data: for a host account we need your email address, and for an order the payment details at Stripe; without them we cannot perform the contract. Guests only need to choose photos; the name is optional.",
            "Automated decisions: we make no decisions based solely on automated processing that have legal effects on you (Art. 22 GDPR). The automatic check for explicit content only flags photos; the host decides whether a photo stays.",
          ],
        },
        {
          heading: "8. Security",
          body: [
            "All connections are encrypted (HTTPS). Photos are kept in private storage and delivered only through short-lived signed links. Access to production systems is limited to the people who need it, protected by two-factor authentication, and is not used to view photos except as described in section 3.",
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
            "We update this policy when the service or the law changes. The date at the top shows the current version. We tell hosts about significant changes by email.",
          ],
        },
      ],
    },

    terms: {
      title: "Terms and conditions",
      updated: UPDATED,
      intro: `These terms and conditions apply to the use of ${c.appName}, a service of ${seller} ("we"). By creating an account, placing an order or uploading photos you agree to them.`,
      sections: [
        {
          heading: "1. The service",
          body: [
            `${c.appName} lets a host create an event and collect photos from guests through a QR code or link. Guests upload from their phone's browser, without an app or account. Only the host sees the photos; guests only see their own uploads.`,
            "Creating an event is free. Guests can upload once the host has bought a plan for the event and published it. The scope and limits of the plans (number of photos, storage, download window, print templates) are those shown in the pricing at the time of the order.",
          ],
        },
        {
          heading: "2. Account",
          body: [
            "You must be at least 18 to create a host account. Keep access to your email inbox secure, because sign-in codes are sent there. You are responsible for activity in your account.",
          ],
        },
        {
          heading: "3. How the contract is made",
          body: [
            "The plans shown on the website are not a binding offer. You choose a plan, confirm your details and the statement on the right of withdrawal on the payment page and are taken to our payment provider Stripe. By clicking the button to order with obligation to pay, or to pay, on the Stripe page you make a binding offer. The contract is made once the payment succeeds; we confirm it by email.",
            "Until you submit, you can correct your entries at any time with the back buttons and edit links, or cancel.",
            "The contract languages are German, English and Turkish; the German version of these terms is binding. We send you the contract text (order details and these terms) with the order confirmation by email; the current version of the terms is available on this page.",
          ],
        },
        {
          heading: "4. Prices, payment, upgrades",
          body: [
            [
              "A plan is a one-time payment per event, in euros. There is no subscription; nothing renews automatically.",
              "All prices are final prices including statutory VAT.",
              "Payment is made through Stripe with the payment methods offered there. You receive an invoice by email for every order.",
              "You can move an event to a bigger plan at any time and pay only the difference to the plan already paid for.",
            ],
          ],
        },
        {
          heading: "5. Right of withdrawal and refunds",
          body: [
            "Consumers have a statutory right of withdrawal. The details and the model withdrawal form are in the withdrawal instructions.",
            "Because a plan can be used immediately, before payment we ask you to expressly request that we start before the withdrawal period ends and to confirm that you know your right of withdrawal ends once we have fully provided the service.",
            "Withdrawal after the service has started: if you asked us to start before the withdrawal period ends and then withdraw, you pay a reasonable amount for the service provided up to that point (§ 357a(2) BGB). The core of the service is the event itself: your guests being able to upload photos to your album during the event period. The download window afterwards only serves to collect the photos. If you withdraw before the event starts, we refund the full amount. If you withdraw after the event has started, the essential part of the service has been provided and the refund is correspondingly small.",
            "Voluntary refund: as long as no photo has been uploaded to your event and the first payment is at most 14 days old, you can cancel the plan in the event settings with one click and get the full amount back; the event becomes a draft again. If something went wrong on our side, write to us and we refund in full or in part. Your statutory rights are not affected.",
          ],
        },
        {
          heading: "6. Event window and deletion",
          body: [
            "An event lasts at most 24 hours, 48 hours on the VIP plan. Guests can upload photos only between the start and the end of the event. All photos are kept until the end of the download window of the chosen plan (7, 14, 21 or 30 days after the event ends for Mini, Standard, Pro or VIP) and then permanently deleted. It is up to the host to download the album in that time. We send reminders before deletion but cannot restore deleted photos.",
          ],
        },
        {
          heading: "7. Host obligations",
          body: [
            "As host you decide who receives the QR code or link. You agree to",
            [
              "use the service only for real events and not to publish the link in a way that invites strangers to upload;",
              "tell your guests in a suitable way that photos are being collected for you (for example on the printed card);",
              "handle the photos you receive in line with data protection law and the rights of the people shown, in particular before publishing them anywhere else;",
              "use the tools provided (delete, block a phone, PIN, report) if unwanted content is uploaded.",
            ],
          ],
        },
        {
          heading: "8. Content rules",
          body: [
            "Whoever uploads a photo must hold the rights to it or be allowed to share it and, where the law requires it, have the consent of the people shown. Not allowed are:",
            [
              "illegal content, in particular any sexual depiction of minors;",
              "content that infringes copyright, personality or data protection rights of others;",
              "content that glorifies violence, incites hatred, harasses, or is pornographic;",
              "malware or files that are not photos.",
            ],
            `By uploading, the guest grants the host the right to keep, download and use the photos for private purposes connected with the event. The guest keeps their rights in the photos. To have a photo removed, contact the host or ${c.supportEmail}.`,
          ],
        },
        {
          heading: "9. Moderation and reports",
          body: [
            "An automatic check for explicit sexual content is in preparation and not active yet. Once it starts, every uploaded photo is checked (Sightengine). Flagged photos are not deleted but kept out of the album and downloads; the host decides whether to show and keep them. The check can be wrong; it does not decide on blocking or deletion.",
            `Hosts can report a photo in the album as illegal; it is then hidden from everyone at once and we review the report. Anyone else can report illegal content through ${c.contactUrl} or to ${c.supportEmail} (see "Report content"). We handle reports promptly, tell the reporter our decision and give the affected host the reasons for any restriction, where the law allows.`,
            "If these terms or the law are broken we may remove content and suspend events or accounts. We report child sexual abuse material to the competent authorities.",
          ],
        },
        {
          heading: "10. Our rights in content",
          body: [
            "We only use photos to provide the service: to store them, create previews and make them available to the host. We claim no ownership, do not look at them or show them to anyone, and do not use them for advertising or AI training. We open a photo only where the law requires it or the host asks us for support (see the privacy policy).",
          ],
        },
        {
          heading: "11. Availability",
          body: [
            "We aim to keep the service available, especially during events, but cannot guarantee uninterrupted operation, for example during maintenance, network problems at the venue or outages of our providers.",
          ],
        },
        {
          heading: "12. Liability",
          body: [
            "We are liable without limitation for intent and gross negligence, for injury to life, body or health and under the German Product Liability Act. For slight negligence we are only liable for breaches of essential contractual obligations (obligations whose fulfilment makes the proper performance of the contract possible in the first place and on whose compliance you may regularly rely), limited to the damage typical and foreseeable for this contract.",
            "We are not liable for photos lost because they were not downloaded within the download window, provided we sent a timely reminder.",
          ],
        },
        {
          heading: "13. Changes to these terms",
          body: [
            "We may change these terms for future orders. Plans already bought are not affected. We tell hosts with an account about material changes by email.",
          ],
        },
        {
          heading: "14. Final provisions",
          body: [
            "German law applies, excluding the UN Convention on Contracts for the International Sale of Goods. For consumers this applies only insofar as mandatory consumer protection rules of the country of their habitual residence do not conflict.",
            "If you are a merchant, a legal entity under public law or a special fund under public law, the place of jurisdiction is Hamburg.",
            "We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.",
            "If a provision is invalid, the remaining provisions stay in force.",
          ],
        },
      ],
    },

    withdrawal: {
      title: "Withdrawal instructions",
      updated: UPDATED,
      intro:
        "Consumers have a right of withdrawal as follows. A consumer is any natural person who enters into a legal transaction for purposes that are predominantly outside their trade, business or profession. (Translation; the German withdrawal instructions are binding.)",
      sections: [
        {
          heading: "Right of withdrawal",
          body: [
            "You have the right to withdraw from this contract within fourteen days without giving any reason.",
            "The withdrawal period is fourteen days from the day the contract is concluded.",
            `To exercise your right of withdrawal, you must inform us (${reach}) of your decision to withdraw from this contract by an unequivocal statement (for example a letter sent by post or an email). You may use the attached model withdrawal form, but it is not obligatory.`,
            `You can also exercise your right of withdrawal online at ${c.withdrawUrl}. If you use this online function, we will send you, without undue delay, an acknowledgement of receipt on a durable medium (e.g. by email) with information on the content of the withdrawal and the date and time it was received.`,
            "To meet the withdrawal deadline, it is sufficient that you send your communication concerning the exercise of the right of withdrawal before the withdrawal period has expired.",
          ],
        },
        {
          heading: "Effects of withdrawal",
          body: [
            "If you withdraw from this contract, we shall reimburse all payments received from you without undue delay and in any event not later than fourteen days from the day on which we are informed of your decision to withdraw from this contract. We will carry out such reimbursement using the same means of payment as you used for the initial transaction, unless you have expressly agreed otherwise; in any event, you will not incur any fees as a result of such reimbursement.",
            "If you requested that the services begin during the withdrawal period, you shall pay us an amount which is in proportion to what has been provided until you have communicated to us your withdrawal from this contract, in comparison with the full coverage of the contract.",
          ],
        },
        {
          heading: "End of the right of withdrawal",
          body: [
            "For a contract for the supply of services, the right of withdrawal ends when we have fully performed the service and only began performance after you gave your express consent and at the same time acknowledged that you lose your right of withdrawal once we have fully performed the contract.",
          ],
        },
        {
          heading: "Model withdrawal form",
          body: [
            "(Complete and return this form only if you wish to withdraw from the contract.)",
            [
              `To ${seller}, email: ${c.supportEmail}:`,
              "I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract for the provision of the following service (*)",
              "Ordered on (*)",
              "Name of consumer(s)",
              "Address of consumer(s)",
              "Signature of consumer(s) (only if this form is notified on paper)",
              "Date",
            ],
            "(*) Delete as appropriate.",
          ],
        },
      ],
    },

    cookies: {
      title: "Cookies",
      updated: UPDATED,
      sections: [
        {
          heading: "Necessary cookies",
          body: [
            "We only set cookies that are technically necessary for the service (§ 25(2) TDDDG). They need no consent:",
            [
              "Sign-in (hosts): keeps you signed in. Expires when you sign out or after 7 days without use.",
              "Language (NEXT_LOCALE): remembers the language you picked.",
              "Guest device (erg_…): one per event; holds a random device ID and proof that the bot check (and PIN, if any) was passed. The proof lasts 12 hours, the device ID one year or until the event is deleted.",
              "Local storage in your browser: an event draft you start before signing in, and which photos you have already saved to your phone, stay only in your browser and are not sent to us. You can clear both in your browser settings.",
            ],
            "On Stripe's payment page, Stripe sets its own cookies needed for the payment and fraud prevention; Stripe's privacy policy applies to them.",
          ],
        },
        {
          heading: "No analytics or advertising cookies",
          body: [
            "We set no analytics, tracking or advertising cookies. If that changes, we will only set such cookies after you agree in a cookie banner, and you can change your choice at any time.",
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
            c.company,
            c.address,
            `Represented by the managing director: ${c.managingDirector}`,
            `Commercial register: ${c.register}`,
            `Phone: ${c.phone}`,
            `Email: ${c.supportEmail}`,
            `Contact form: ${c.contactUrl}`,
          ],
        },
        {
          heading: "Point of contact under the Digital Services Act",
          body: [
            `Single point of contact for authorities (Art. 11 DSA) and for users (Art. 12 DSA): ${c.supportEmail} and ${c.contactUrl}. You can write to us in German, English or Turkish.`,
          ],
        },
        {
          heading: "Consumer dispute resolution",
          body: [
            "We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.",
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
            `If you find content on ${c.appName} that is illegal, infringes your rights or shows you without your consent, write to ${c.supportEmail} or use the contact form (${c.contactUrl}) with:`,
            [
              "the event link (or the event's name and date);",
              "a description of the photo, for example who uploaded it and when;",
              "why you believe the content is illegal or infringes your rights;",
              "your name and email address, except when reporting child sexual abuse material, which can be done anonymously;",
              "a statement that your information is accurate and complete to the best of your knowledge.",
            ],
            "As a guest you can also ask the host directly to remove a photo of you: hosts can delete any photo at any time.",
          ],
        },
        {
          heading: "What happens next",
          body: [
            "We confirm receipt, review every report promptly and carefully and tell you our decision. Clearly illegal content is removed immediately; the event may be suspended. We inform the affected host of any restriction and the reasons, where the law allows. Child sexual abuse material is reported to the competent authorities.",
          ],
        },
      ],
    },
  };
}
