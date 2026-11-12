/**
 * Skabeloner til nye events – udfylder formularen, så Villads kun skal vælge dato og pris.
 * Mange af idéerne kommer fra Villads' OneNote (Gåture/Vandring, Aktiviteter til familien,
 * Gaveidéer og oplevelser, Tips og tricks).
 *
 * Har en skabelon `activity`, bliver den også oprettet som et aktivitet-produkt i butikken
 * (npm run db:seed), med en "Sig at du er interesseret"-knap indtil der kommer en dato.
 */
export type EventTemplate = {
  key: string;
  title: string;
  emoji: string;
  color: string;
  summary: string;
  practicalInfo?: string;
  location?: string;
  hours: number;
  /** Pris pr. person i øre (et forslag) */
  price: number;
  capacity?: number;
  minParticipants: number;
  /** Produktet eventet hører til (eksisterende eller oprettet fra `activity`) */
  productSlug?: string;
  activity?: { tagline: string; headline: string; description: string; goodFor: string[] };
};

const T = (t: EventTemplate) => t;

export const EVENT_TEMPLATES: EventTemplate[] = [
  /* ---------- Offentlige aktiviteter (bliver til produkter) ---------- */
  T({
    key: "bow-combat",
    title: "Bow combat",
    emoji: "🏹",
    color: "#06d6a0",
    summary: "Bueskydning med skumpile mod hinanden. Ingen erfaring krævet – kun mod.",
    practicalInfo: "Tøj du kan bevæge dig i og indendørssko/løbesko. Udstyr og ansigtsmasker er med i prisen. Mød op 15 min. før.",
    hours: 2,
    price: 25000,
    capacity: 12,
    minParticipants: 6,
    productSlug: "bow-combat",
    activity: {
      tagline: "Jeg skyder dig (med skum)",
      headline: "Bow combat – vi skyder hinanden med skumpile",
      description:
        "Det er ligesom paintball, bare med bue og pil og uden blå mærker. To hold, en bane fuld af forhindringer og en dommer, der ikke kan bestikkes.\n\nVi bliver kun til noget, hvis vi er nok – så tag gerne en ven med.",
      goodFor: ["Fødselsdage", "Firmaer der skylder hinanden noget", "Venner med uafklarede konflikter"],
    },
  }),
  T({
    key: "lasertag",
    title: "Lasertag",
    emoji: "🔦",
    color: "#a66cff",
    summary: "Hold mod hold med laservåben i mørket. Røg, lys og total ydmygelse.",
    practicalInfo: "Mørkt tøj er en fordel. Udstyr er med i prisen. Mød op 15 min. før til instruktion.",
    hours: 2,
    price: 22500,
    capacity: 16,
    minParticipants: 6,
    productSlug: "lasertag",
    activity: {
      tagline: "Jeg rammer dig i mørket",
      headline: "Lasertag – hold mod hold i mørket",
      description: "Vi deler os i hold og jagter hinanden gennem en labyrint med røg og blinkende lys. Pointtavlen lyver aldrig.",
      goodFor: ["Dem der savner at være 12 år", "Fredag aften", "Konkurrencemennesker"],
    },
  }),
  T({
    key: "mtb-tur",
    title: "MTB-tur",
    emoji: "🚵",
    color: "#ff9f1c",
    summary: "Mountainbike på stier i skoven. Mudder er en del af oplevelsen.",
    practicalInfo: "Medbring cykel (eller sig til, så finder vi en at låne), hjelm, vand og noget at spise. Tøj der må blive beskidt. Ruten ligger på kortet.",
    hours: 3,
    price: 5000,
    capacity: 10,
    minParticipants: 3,
    productSlug: "mtb-tur",
    activity: {
      tagline: "Jeg cykler dig i skoven",
      headline: "MTB-tur gennem skoven",
      description: "En tur på mountainbike ad stier, rødder og bakker. Vi kører i et tempo, så alle kan være med, og holder pause med kaffe på toppen.",
      goodFor: ["Dem der vil prøve MTB", "Søndag formiddag", "Folk der elsker mudder"],
    },
  }),
  T({
    key: "saunatur",
    title: "Saunatur",
    emoji: "🧖",
    color: "#ff70a6",
    summary: "Varm sauna, koldt vand, gentag. Bagefter er alt godt.",
    practicalInfo: "Medbring badetøj, håndklæde, badesko og noget at drikke. Vi deler entréen til saunaen.",
    hours: 3,
    price: 10000,
    capacity: 8,
    minParticipants: 3,
    productSlug: "saunatur",
    activity: {
      tagline: "Jeg sveder med dig",
      headline: "Saunatur med vinterbadning",
      description: "Vi skiftes mellem sauna og koldt vand, til hjernen er helt tom. De bedste samtaler sker på saunabænken.",
      goodFor: ["Mørke vinteraftener", "Stressede venner", "Dem der aldrig har vinterbadet"],
    },
  }),
  T({
    key: "bytur",
    title: "Bytur",
    emoji: "🌃",
    color: "#4d96ff",
    summary: "Middag, drinks og måske dans. Vi slutter, når skoene gør ondt.",
    practicalInfo: "Vi mødes til spisning og tager den derfra. Prisen dækker bordbestilling – mad og drikke betaler hver især.",
    hours: 6,
    price: 5000,
    capacity: 10,
    minParticipants: 4,
    productSlug: "bytur",
    activity: {
      tagline: "Jeg tager dig i byen",
      headline: "Bytur – middag, drinks og dans",
      description: "En aften i byen, som vi planlægger sammen: et godt sted at spise, en bar med gode drinks og et dansegulv til dem, der har energien.",
      goodFor: ["Fredag eller lørdag", "Når nogen skal fejres", "Når nogen skal opmuntres"],
    },
  }),
  T({
    key: "vandretur",
    title: "Vandretur",
    emoji: "🥾",
    color: "#8ac926",
    summary: "En god gåtur i naturen med madpakke og snak. Ingen skal løbe.",
    practicalInfo: "Gode sko, vand og madpakke. Klæd dig efter vejret. Turen er ca. 8-12 km i roligt tempo.",
    hours: 4,
    price: 0,
    capacity: 15,
    minParticipants: 3,
    productSlug: "vandretur",
    activity: {
      tagline: "Jeg går en tur med dig",
      headline: "Vandretur i dansk natur",
      description:
        "Vi går en af mine yndlingsruter: Mols Bjerge, Silkeborg-søerne, Banestien Horsens–Odder, Lisbjerg Skov eller gåturen til Helligbjerg ved Auning. Madpakke på toppen.",
      goodFor: ["Søndage", "Gode samtaler", "Dem der vil se mere af Danmark"],
    },
  }),
  T({
    key: "shelternat",
    title: "Shelternat",
    emoji: "🏕️",
    color: "#2a9d8f",
    summary: "Bål, snobrød og en nat i shelter. Pindsvinesøvn garanteret.",
    practicalInfo: "Medbring sovepose, liggeunderlag, varmt tøj, pandelampe og kop. Jeg sørger for bål, aftensmad og morgenmad.",
    location: "Wilhelmsborg shelter eller Hørhaven shelter",
    hours: 18,
    price: 10000,
    capacity: 8,
    minParticipants: 3,
    productSlug: "shelternat",
    activity: {
      tagline: "Jeg sover under stjernerne med dig",
      headline: "En nat i shelter med bål og snobrød",
      description: "Vi tænder bål, laver mad over ilden og sover i shelter. Om morgenen er der kaffe på bålet og dug på det hele.",
      goodFor: ["Sommer og sensommer", "Dem der aldrig har sovet udenfor", "Stjernekiggere"],
    },
  }),
  T({
    key: "gloegg-og-aebleskiver",
    title: "Gløgg og æbleskiver udenfor",
    emoji: "🍷",
    color: "#e63946",
    summary: "En stor gryde gløgg, varme æbleskiver og kolde tæer i det fri.",
    practicalInfo: "Klæd dig varmt på – vi er udenfor hele tiden. Jeg har gløgg (også alkoholfri), æbleskiver og bål med.",
    hours: 3,
    price: 5000,
    minParticipants: 4,
    productSlug: "gloegg-og-aebleskiver",
    activity: {
      tagline: "Jeg varmer dig med gløgg",
      headline: "Gløgg og æbleskiver ved bålet",
      description: "Vinterens hyggeligste aften: en stor gryde gløgg, æbleskiver med syltetøj og flormelis og et bål at stå om.",
      goodFor: ["December", "Julefrokost-alternativ", "Kolde hænder"],
    },
  }),

  /* ---------- Eksisterende produkter ---------- */
  T({
    key: "foedselsdag",
    title: "Min fødselsdag",
    emoji: "🎂",
    color: "#ffb4a2",
    summary: "Kom med til en rund fødselsdag – kage, sang og alt det løse.",
    hours: 4,
    price: 10000,
    capacity: 20,
    minParticipants: 1,
    productSlug: "foedselsdag",
  }),
  T({
    key: "cykeltur",
    title: "Cykeltur gennem Danmark",
    emoji: "🚴",
    color: "#4d96ff",
    summary: "Vi cykler sammen gennem Danmark. Ruten ligger på kortet – upload den som GPX.",
    practicalInfo: "Medbring cykel, hjelm, lappegrej, vand og madpakke.",
    hours: 8,
    price: 15000,
    capacity: 10,
    minParticipants: 2,
    productSlug: "cykelruter",
  }),

  /* ---------- Flere idéer (kun skabeloner) ---------- */
  T({ key: "paintball", title: "Paintball", emoji: "🔫", color: "#a66cff", summary: "Hold mod hold i skoven. Jeg står for holdinddelingen (og tager sikkert et par skud for dig).", practicalInfo: "Tøj der må blive beskidt og solide sko. Udstyr og 200 kugler er med.", hours: 3, price: 35000, capacity: 16, minParticipants: 8 }),
  T({ key: "gyserfilm", title: "Gyserfilm hos mig", emoji: "👻", color: "#b8b8d1", summary: "Sofa, tæpper, popcorn og en film, du ikke tør se alene.", location: "Hjemme hos Villads", hours: 3, price: 5000, capacity: 6, minParticipants: 2 }),
  T({ key: "drinks-i-parken", title: "Drinks i parken", emoji: "🍹", color: "#ffd23f", summary: "Tæppe på græsset, kolde drinks og gode snakke. Jeg medbringer shakeren.", hours: 3, price: 7500, minParticipants: 3 }),
  T({ key: "escape-room", title: "Escape room", emoji: "🔐", color: "#6a4c93", summary: "60 minutter til at slippe ud. Samarbejde, gåder og panik.", hours: 2, price: 25000, capacity: 6, minParticipants: 4 }),
  T({ key: "gokart", title: "Gokart", emoji: "🏎️", color: "#ef476f", summary: "Hjelm på og fuld gas. Vi kører om, hvem der giver kaffe bagefter.", practicalInfo: "Lukkede sko. Hjelm og dragt udleveres.", hours: 2, price: 30000, capacity: 12, minParticipants: 4 }),
  T({ key: "bowling", title: "Bowling", emoji: "🎳", color: "#118ab2", summary: "To timers bowling med pizza bagefter. Rendebolde er tilladt.", hours: 2, price: 15000, capacity: 12, minParticipants: 6 }),
  T({ key: "klatrepark", title: "Klatrepark", emoji: "🐒", color: "#06d6a0", summary: "Svævebaner og hængebroer i trætoppene – fx Funky Monkey Park i Kolding eller Odense.", practicalInfo: "Tøj du kan bevæge dig i og lukkede sko.", hours: 3, price: 30000, capacity: 10, minParticipants: 4 }),
  T({ key: "lerdueskydning", title: "Lerdueskydning", emoji: "🎯", color: "#8d6e63", summary: "Prøv at skyde lerduer med instruktør. Det er sværere end det ser ud.", hours: 2, price: 35000, capacity: 8, minParticipants: 4 }),
  T({ key: "fisketur", title: "Fisketur (put and take)", emoji: "🎣", color: "#457b9d", summary: "En dag ved søen med stang, termokande og tålmodighed.", practicalInfo: "Fisketegn og stang – sig til, hvis du skal låne. Varmt tøj og madpakke.", hours: 5, price: 20000, capacity: 8, minParticipants: 2 }),
  T({ key: "discgolf", title: "Discgolf", emoji: "🥏", color: "#90be6d", summary: "18 huller med frisbee i parken. Ingen erfaring nødvendig – jeg har discs med.", hours: 2, price: 0, capacity: 12, minParticipants: 3 }),
  T({ key: "kano-kajak", title: "Kano- eller kajaktur", emoji: "🛶", color: "#00b4d8", summary: "En dag på vandet med frokost på bredden.", practicalInfo: "Tøj der må blive vådt, skiftetøj og madpakke. Kano og redningsvest er med.", hours: 5, price: 30000, capacity: 10, minParticipants: 4 }),
  T({ key: "solopgangstur", title: "Solopgangstur", emoji: "🌅", color: "#ffbe0b", summary: "Vi står tidligt op og ser solen stå op med kaffe og rundstykker.", practicalInfo: "Varmt tøj og pandelampe. Jeg har kaffe og rundstykker med.", hours: 2, price: 0, minParticipants: 2 }),
  T({ key: "skovsnogen", title: "Skovsnogen", emoji: "🐍", color: "#52b788", summary: "Kunst i skoven: en gåtur blandt værkerne i Skovsnogen.", location: "Skovsnogen, Deep Forest Artland", hours: 3, price: 0, minParticipants: 2 }),
  T({ key: "trampolinpark", title: "Trampolinpark", emoji: "🤸", color: "#f72585", summary: "En times hoppen i Rush trampolinpark. Skridsikre sokker er et must.", hours: 2, price: 20000, capacity: 12, minParticipants: 4 }),
  T({ key: "karaoke", title: "Karaoke", emoji: "🎤", color: "#b5179e", summary: "Et privat karaokerum og en playliste uden skam.", hours: 3, price: 15000, capacity: 10, minParticipants: 4 }),
  T({ key: "bordtennis", title: "Bordtennis i Saralystparken", emoji: "🏓", color: "#2ec4b6", summary: "Rundbordtennis ved bordet i parken. Jeg har bats og bolde.", location: "Saralystparken", hours: 2, price: 0, minParticipants: 3 }),
  T({ key: "gaadeskattejagt", title: "Gådeskattejagt", emoji: "🗝️", color: "#ff9f1c", summary: "Gåder, spor og en skat. Jeg har lavet posterne – I skal bare løse dem.", hours: 2, price: 5000, minParticipants: 4 }),
  T({ key: "pluk-selv", title: "Pluk-selv-eventyr", emoji: "🍓", color: "#e63946", summary: "Vi plukker jordbær, æbler eller hvad sæsonen byder på hos et gartneri.", hours: 3, price: 0, minParticipants: 2 }),
  T({ key: "morild", title: "Morild-badetur", emoji: "✨", color: "#3a0ca3", summary: "Nattebad i havet, når vandet lyser af morild. Ren magi i sensommeren.", practicalInfo: "Badetøj, håndklæde, varmt tøj til bagefter og pandelampe.", hours: 2, price: 0, minParticipants: 2 }),
  T({ key: "tivoli-friheden", title: "Tivoli Friheden", emoji: "🎡", color: "#ff006e", summary: "Karruseller, candyfloss og et skud i skydeteltet.", location: "Tivoli Friheden, Aarhus", hours: 5, price: 0, minParticipants: 2 }),
  T({ key: "helligbjerg", title: "Gåtur til Helligbjerg", emoji: "⛰️", color: "#6a994e", summary: "6,7 km gennem Lunden ved Gl. Estrup – forbi grevens gravsted og stenbordet.", practicalInfo: "Ikke til klapvogn. Gode sko og madpakke.", location: "Lunden ved Gl. Estrup, Auning", hours: 3, price: 0, minParticipants: 2, productSlug: "vandretur" }),
  T({ key: "mols-bjerge", title: "Vandretur i Mols Bjerge", emoji: "🏞️", color: "#bc6c25", summary: "Bakker, lyng og udsigt – og måske brunch på Karpenhøj Naturcenter.", location: "Mols Bjerge", hours: 5, price: 0, minParticipants: 2, productSlug: "vandretur" }),
  T({ key: "aarslev-engsoe", title: "Madpakketur til Årslev Engsø", emoji: "🦆", color: "#4ea8de", summary: "En rolig tur rundt om søen med madpakke og fuglekig.", location: "Årslev Engsø", hours: 3, price: 0, minParticipants: 2, productSlug: "vandretur" }),
  T({ key: "banestien", title: "Banestien Horsens–Odder", emoji: "🛤️", color: "#7f5539", summary: "Vi går på den gamle jernbane mellem Horsens og Odder.", hours: 5, price: 0, minParticipants: 2, productSlug: "vandretur" }),
];
