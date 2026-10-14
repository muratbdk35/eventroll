/**
 * Third-party notices: UI code we adapted, fonts and photos. Runtime libraries
 * come from third-party-libs.json (`npm run notices`). Licences were checked
 * on 2026-10-14 against the author's repo or 21st.dev page; add an entry here
 * whenever code from outside is copied or adapted (DECISIONS #36).
 */
import libs from "./third-party-libs.json";

export type Notice = {
  name: string;
  author: string;
  license: string;
  url: string;
  usedFor: string;
};

export const adaptedComponents: Notice[] = [
  {
    name: "Receipt Tiers (Spectrum UI)",
    author: "arihantcodes",
    license: "Apache-2.0",
    url: "https://github.com/arihantcodes/spectrum-ui",
    usedFor:
      "Pricing receipts and plan step. Modified: rewritten in our styles, prices and translations.",
  },
  {
    name: "Masonry Lightbox (Serenity UI)",
    author: "Ayushmaan Singh (ayushmxxn)",
    license: "MIT",
    url: "https://21st.dev/@ayushmxxn/components/masonry-lightbox",
    usedFor: "Host photo grid and viewer. Modified.",
  },
  {
    name: "Multi-Step Setup Wizard",
    author: "Oliver (olewandowski1)",
    license: "MIT-0",
    url: "https://21st.dev/@olewandowski1/components/onboarding-3",
    usedFor: "Create-event step layout. Modified.",
  },
  {
    name: "Veil Sign Up 2 (Tailark)",
    author: "Méschac Irung (meschacirung)",
    license: "MIT",
    url: "https://21st.dev/@meschacirung/components/veil-sign-up-2",
    usedFor: "Account step layout. Modified.",
  },
  {
    name: "Checkout Summary",
    author: "astralyxdev",
    license: "MIT",
    url: "https://21st.dev/@astralyxdev/components/checkout-summary",
    usedFor: "Payment summary layout. Modified.",
  },
  {
    name: "Auth Verify Email (HextaUI)",
    author: "Preet Suthar (preetsuthar17)",
    license: "MIT",
    url: "https://21st.dev/@preetsuthar17/components/auth-verify-email",
    usedFor: "Sign-in and email confirmation screens. Modified.",
  },
  {
    name: "shadcn/ui",
    author: "shadcn",
    license: "MIT",
    url: "https://github.com/shadcn-ui/ui",
    usedFor: "Base components (buttons, inputs, menus, calendar).",
  },
];

export const fonts: Notice[] = [
  {
    name: "Bricolage Grotesque",
    author: "Mathieu Triay",
    license: "OFL-1.1",
    url: "https://fonts.google.com/specimen/Bricolage+Grotesque",
    usedFor: "Headings.",
  },
  {
    name: "Geist, Geist Mono",
    author: "Vercel",
    license: "OFL-1.1",
    url: "https://github.com/vercel/geist-font",
    usedFor: "Body text and numbers.",
  },
];

export const photos = {
  license: "Unsplash License",
  url: "https://unsplash.com/license",
  ids: [
    "h9pJ_AhSHsA",
    "dDJfw2z6c78",
    "ULHxWq8reao",
    "0CklaCuehpc",
    "22JxStzTxwo",
    "IsESwCm9b4Y",
    "Jx5QwP9Rlog",
    "Np1nSXAOTXE",
    "-ufMDkBOwGY",
    "ETGJjk9o-48",
    "_kd5cxwZOK4",
    "JW9BZXx5-sI",
  ],
};

export const libraries: (Omit<Notice, "author" | "usedFor"> & {
  version: string;
})[] = libs;

/** Full licence texts we ship, keyed by SPDX id. */
export const licenseTexts: Record<string, string> = {
  "Apache-2.0": "/licenses/Apache-2.0.txt",
  MIT: "/licenses/MIT.txt",
  "MIT-0": "/licenses/MIT-0.txt",
  "OFL-1.1": "https://openfontlicense.org/open-font-license-official-text/",
};
