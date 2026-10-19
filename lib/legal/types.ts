export const legalPages = [
  "privacy",
  "terms",
  "withdrawal",
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

/** Everything the texts need to know about the seller and the app. */
export type LegalCtx = {
  appName: string;
  supportEmail: string;
  phone: string;
  contactUrl: string;
  /** The online withdrawal function (§ 356a BGB). */
  withdrawUrl: string;
  company: string;
  address: string;
  managingDirector: string;
  register: string;
};

export type LegalDocs = Record<LegalPage, LegalDoc>;
