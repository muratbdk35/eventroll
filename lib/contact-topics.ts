/** What a contact message is about (lib/contact.ts). */
export const TOPICS = ["general", "payment", "event", "legal"] as const;
export type Topic = (typeof TOPICS)[number];
