/** Skabeloner til nye events – udfylder formularen, så Villads kun skal vælge dato og pris */
export type EventTemplate = {
  key: string;
  title: string;
  emoji: string;
  color: string;
  summary: string;
  location?: string;
  hours: number;
  price: number;
  capacity?: number;
  productSlug?: string;
};

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    key: "foedselsdag",
    title: "Min fødselsdag",
    emoji: "🎂",
    color: "#ffb4a2",
    summary: "Kom med til en rund fødselsdag – kage, sang og alt det løse.",
    hours: 4,
    price: 10000,
    capacity: 20,
    productSlug: "foedselsdag",
  },
  {
    key: "bow-combat",
    title: "Bow combat",
    emoji: "🏹",
    color: "#06d6a0",
    summary: "Bueskydning med skumpile mod hinanden. Ingen erfaring krævet – kun mod.",
    hours: 2,
    price: 25000,
    capacity: 12,
  },
  {
    key: "paintball",
    title: "Paintball",
    emoji: "🔫",
    color: "#a66cff",
    summary: "Hold mod hold i skoven. Jeg står for holdinddelingen (og tager sikkert et par skud for dig).",
    hours: 3,
    price: 35000,
    capacity: 16,
  },
  {
    key: "gyserfilm",
    title: "Gyserfilm hos mig",
    emoji: "👻",
    color: "#b8b8d1",
    summary: "Sofa, tæpper, popcorn og en film, du ikke tør se alene.",
    location: "Hjemme hos Villads",
    hours: 3,
    price: 5000,
    capacity: 6,
  },
  {
    key: "drinks-i-parken",
    title: "Drinks i parken",
    emoji: "🍹",
    color: "#ffd23f",
    summary: "Tæppe på græsset, kolde drinks og gode snakke. Jeg medbringer shakeren.",
    hours: 3,
    price: 7500,
  },
  {
    key: "cykeltur",
    title: "Cykeltur gennem Danmark",
    emoji: "🚴",
    color: "#4d96ff",
    summary: "Vi cykler sammen gennem Danmark. Ruten ligger på kortet – upload den som GPX.",
    hours: 8,
    price: 15000,
    capacity: 10,
    productSlug: "cykelruter",
  },
];
