/** Alle interaktive oplevelser – bruges på /oplevelser og til links fra produktsiderne */
export const EXPERIENCES = [
  {
    slug: "baenkekortet",
    title: "Bænkekortet",
    emoji: "🪑",
    color: "#4d96ff",
    text: "Alle de bænke, jeg har siddet på og tænkt på folk. Klik på en nål og se hvem.",
    products: ["baenk"],
  },
  {
    slug: "himmelglobussen",
    title: "Himmelglobussen",
    emoji: "🌍",
    color: "#7bdff2",
    text: "En 3D-jord med alle de stykker himmel og skyer, folk har købt.",
    products: ["stykke-af-himlen", "en-sky-efter-dig"],
  },
  {
    slug: "tankemaaleren",
    title: "Tankemåleren",
    emoji: "💭",
    color: "#ffc6ff",
    text: "Hvor mange mennesker har jeg tænkt på – og i hvor mange minutter?",
    products: ["taenk-paa-dig"],
  },
  {
    slug: "lussing-hitlisten",
    title: "Lussing-hitlisten",
    emoji: "👋",
    color: "#ff8fab",
    text: "Rødme-skalaen og de mest dramatiske lussinger nogensinde.",
    products: ["lussing"],
  },
  {
    slug: "foedselsdage",
    title: "Fødselsdags-nedtællingen",
    emoji: "🎂",
    color: "#ff595e",
    text: "Live nedtælling til min næste runde fødselsdag. Kom med!",
    products: ["foedselsdag"],
  },
  {
    slug: "ruterne",
    title: "Rutekortet",
    emoji: "🚲",
    color: "#2ec4b6",
    text: "Mine cykel- og vandreruter gennem Europa – tegnet på kortet.",
    products: ["cykelruter"],
  },
  {
    slug: "vaeggen",
    title: "Væggen",
    emoji: "🖼️",
    color: "#ffd166",
    text: "Min stuevæg med alle de venner, der har købt en plads i mit hjem.",
    products: ["billede-i-mit-hjem", "papfigur-paa-ferie"],
  },
  {
    slug: "godhed",
    title: "Godhedstermometret",
    emoji: "🌡️",
    color: "#06d6a0",
    text: "Mad til hjemløse og lån til iværksættere – så meget godt har vi gjort sammen.",
    products: ["mad-til-hjemloese", "kiva"],
  },
  {
    slug: "gaekkebrev",
    title: "Gækkebrev-værkstedet",
    emoji: "✂️",
    color: "#b5838d",
    text: "Klip dit eget gækkebrev digitalt – og bestil et rigtigt fra mig.",
    products: ["gaekkebrev"],
  },
  {
    slug: "godnat",
    title: "Godnathistorierne",
    emoji: "🌙",
    color: "#3a0ca3",
    text: "Lyt til godnathistorierne under en stjernehimmel.",
    products: ["godnathistorie"],
  },
] as const;

export type ExperienceSlug = (typeof EXPERIENCES)[number]["slug"];

export function experienceFor(productSlug: string) {
  return EXPERIENCES.find((e) => (e.products as readonly string[]).includes(productSlug));
}
