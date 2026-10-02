import type { OrderStatus } from "@/db/schema";

export const STATUS_INFO: Record<OrderStatus, { label: string; emoji: string; color: string; customerText: string }> = {
  afventer_betaling: {
    label: "Afventer betaling",
    emoji: "⏳",
    color: "#ffd23f",
    customerText: "Jeg venter på din MobilePay-overførsel.",
  },
  betalt: { label: "Betalt", emoji: "💙", color: "#7bdff2", customerText: "Betalingen er modtaget – tak, min ven!" },
  i_gang: { label: "I gang", emoji: "🛠️", color: "#a66cff", customerText: "Jeg er i fuld gang med dit venskab." },
  leveret: { label: "Leveret", emoji: "🎉", color: "#06d6a0", customerText: "Dit venskab er leveret. Vi ses! 💛" },
  annulleret: { label: "Annulleret", emoji: "🙅", color: "#ff8fab", customerText: "Ordren er annulleret." },
};
