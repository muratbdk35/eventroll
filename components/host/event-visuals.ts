import {
  Baby,
  Briefcase,
  Cake,
  GraduationCap,
  Heart,
  PartyPopper,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type EventType =
  | "wedding"
  | "birthday"
  | "corporate"
  | "baby_shower"
  | "graduation"
  | "party"
  | "other";

/** Cover photo (Unsplash license, see public/marketing/CREDITS.md) and icon per event type. */
export const eventVisuals: Record<
  EventType,
  { cover: string; Icon: LucideIcon }
> = {
  wedding: { cover: "/marketing/couple-ribbons.jpg", Icon: Heart },
  birthday: { cover: "/marketing/birthday-candles.jpg", Icon: Cake },
  corporate: { cover: "/marketing/table-toast.jpg", Icon: Briefcase },
  baby_shower: { cover: "/marketing/baby-balloons.jpg", Icon: Baby },
  graduation: { cover: "/marketing/graduation.jpg", Icon: GraduationCap },
  party: { cover: "/marketing/confetti.jpg", Icon: PartyPopper },
  other: { cover: "/marketing/sparklers.jpg", Icon: Sparkles },
};
