// Indhold flyttet fra den gamle Google Sites-butik (sites.google.com/view/venskab).
// Priser er i øre. Prisen fungerer stadig som "varenummer" – se /priser.

import type { MediaKind, PriceKind, QuestionKind } from "./schema";

export type SeedCategory = { slug: string; name: string; emoji: string; description: string };

export const seedCategories: SeedCategory[] = [
  {
    slug: "ord-fra-hjertet",
    name: "Ord fra hjertet",
    emoji: "💌",
    description: "Digte, breve, sange og historier – skrevet til dig og kun dig.",
  },
  {
    slug: "jeg-dukker-op",
    name: "Jeg dukker op",
    emoji: "🎉",
    description: "Venskab i fysisk form. Jeg kommer, jeg ses, jeg er der.",
  },
  {
    slug: "praktisk-venskab",
    name: "Praktisk venskab",
    emoji: "🛠️",
    description: "Den slags ven der stabler papkasser, vander blomster og laver madplaner.",
  },
  {
    slug: "smaa-tanker",
    name: "Små tanker",
    emoji: "☁️",
    description: "Mikroskopiske venskabsfragmenter til en lille pris – og en stor følelse.",
  },
  {
    slug: "gode-gerninger",
    name: "Gode gerninger",
    emoji: "🌍",
    description: "Jeg gør verden lidt bedre – i dit navn.",
  },
];

type Media = { kind: MediaKind; url: string; alt?: string; caption?: string; isExample?: boolean };
type Variant = { name: string; price?: number };
type Question = { label: string; kind?: QuestionKind; required?: boolean };
type Testimonial = { authorName: string; text: string; emoji: string; rating?: number };

export type SeedProduct = {
  slug: string;
  name: string;
  tagline: string;
  headline: string;
  summary: string;
  description: string;
  goodFor?: string[];
  finePrint?: string;
  delivery?: string;
  emoji: string;
  color: string;
  category: string;
  priceKind?: PriceKind;
  price: number;
  unitLabel?: string;
  priceEndsWith?: number;
  minPrice?: number;
  recurringLabel?: string;
  featured?: boolean;
  legacyPath: string;
  variants?: Variant[];
  media?: Media[];
  questions?: Question[];
  /** Eksempel-anmeldelser. Markeres som eksempler i databasen og bør erstattes af rigtige. */
  sampleTestimonials?: Testimonial[];
};

const img = (file: string, alt: string, extra: Partial<Media> = {}): Media => ({
  kind: "image",
  url: `/images/products/${file}`,
  alt,
  ...extra,
});
const yt = (id: string, caption = ""): Media => ({ kind: "youtube", url: id, caption });

export const seedProducts: SeedProduct[] = [
  {
    slug: "eskort-dreng",
    name: "Eskort-dreng",
    tagline: "Jeg er din eskort-dreng",
    headline: "Jeg følger dig – og siger ingenting interessant",
    summary: "En fåmælt, ikke-påtrængende følgesvend på dine ærinder.",
    description:
      "Som noget helt nyt kan jeg følge dig med til lægen, på café, ud at spise, med på biblioteket osv. Det særlige ved denne tjeneste er, at jeg ikke siger noget interessant hele vejen. Jeg er bare med. Jeg svarer allerhøjst på praktiske spørgsmål: \"Skal vi gå derhen?\", \"Har du set, at det er grønt?\" osv.",
    finePrint: "Ikke-seksuel og ikke-påtrængende følgesvend.",
    emoji: "🚶",
    color: "#ff6b6b",
    category: "jeg-dukker-op",
    price: 2140,
    featured: true,
    legacyPath: "/start",
    questions: [
      { label: "Hvor skal du hen?", required: true },
      { label: "Hvornår skal du afsted?", kind: "datetime", required: true },
      { label: "Dine kontaktoplysninger i forbindelse med ekskursionen", required: true },
    ],
    sampleTestimonials: [
      {
        authorName: "Mette",
        emoji: "🤐",
        text: "Han sagde ét ord på hele turen til tandlægen: \"Grønt.\" Det var præcis, hvad jeg havde brug for.",
      },
    ],
  },
  {
    slug: "digt",
    name: "Dedikeret digt",
    tagline: "Jeg digter om dig",
    headline: "Få et dedikeret digt",
    summary: "Alvorlig, dyb poesi – med metaforer der ikke nødvendigvis rimer.",
    description:
      "Glem den sang tante Oda skrev om dig, da du fyldte 15 år. Det her er alvorlig, dyb poesi. Her har vi metaforer, der ikke nødvendigvis rimer, og udtryk Benny Andersen begynder at hjemsøge mig for at bruge!\n\nJeg skriver et digt baseret på dig – eller på hvad jeg tænker på i det øjeblik, du køber digtet. Jeg har dedikeret mange digte i min Facebook-gruppe. Du bestemmer selv, om du vil købe et digt her og få det nu og her, eller blive medlem af gruppen, hvor du måske – måske ikke – får et digt dedikeret til dig.",
    delivery: "Digtet fragtes digitalt til dig – du kan også få det på mail.",
    emoji: "📜",
    color: "#a66cff",
    category: "ord-fra-hjertet",
    price: 340,
    featured: true,
    legacyPath: "/start/om-tjenesterne/digt",
    questions: [
      { label: "Fortæl mig lidt om dig (eller den, digtet er til)", kind: "textarea" },
      { label: "Hvor skal digtet sendes hen? (mail, sms, Messenger …)" },
    ],
    sampleTestimonials: [
      {
        authorName: "Jonas",
        emoji: "🥹",
        text: "Der var en metafor om en cykelpumpe, som jeg stadig tænker på. Det rimede ikke. Det var smukt.",
      },
    ],
  },
  {
    slug: "lussing",
    name: "Lussing",
    tagline: "Jeg giver dig aflad for dine frustrationer",
    headline: "Giv mig en lussing",
    summary: "En fladhåndet lussing lige på kinden – så hårdt du vil.",
    description:
      "Hvis du aldrig har slået nogen før, eller hvis dine venner eller din kæreste synes, du er en svagpisser, så prøv dette!\n\nEn fladhåndet lussing lige på kinden, så hårdt du vil. Jeg vil overdramatisere det en smule, så jeg stønner og vælter omkring. Det vil synge for ørerne og blive rødt på kinden.",
    goodFor: [
      "Vodkalussinger",
      "Jeg har sagt noget forkert",
      "Jeg har kigget på din dame",
      "Der er nogen, du vil imponere",
      "Jeg opfører mig Brian-agtigt",
    ],
    delivery:
      "Der er selvfølgelig ikke fragt på en lussing – men vi skal være i samme område, når den finder sted.",
    emoji: "👋",
    color: "#ff8fab",
    category: "jeg-dukker-op",
    price: 540,
    legacyPath: "/start/om-tjenesterne/lussing",
    media: [
      img("lussing.jpg", "Villads klar til at modtage en lussing"),
      img("lussing-eksempel.png", "En lussing i aktion", { isExample: true, caption: "En tidligere køber i aktion" }),
    ],
    questions: [
      { label: "Hvor og hvornår skal lussingen finde sted?", required: true },
      { label: "Hvorfor har jeg fortjent den? (valgfrit)" },
    ],
    sampleTestimonials: [
      {
        authorName: "Kasper",
        emoji: "😤",
        text: "Han væltede ind i en reol og råbte \"AV MIN STOLTHED\". Mine venner ser anderledes på mig nu.",
      },
    ],
  },
  {
    slug: "vittigheder",
    name: "En uge med vittigheder",
    tagline: "Jeg får dig til at grine i en uge",
    headline: "En hel uge med daglige vittigheder på sms",
    summary: "Primært farjokes. Enkelte ordspil. Helt politisk korrekte.",
    description:
      "Hver dag i en uge får du en vittighed på sms. Primært farjokes. Enkelte ordspil. Helt politisk korrekte jokes.\n\nSe eksemplerne i videoerne herunder.",
    delivery: "Vittighederne leveres digitalt – på sms eller mail.",
    emoji: "🤣",
    color: "#ffd23f",
    category: "ord-fra-hjertet",
    price: 440,
    legacyPath: "/start/om-tjenesterne/en-hel-uge-med-daglige-vittigheder-på-sms",
    media: [
      img("vittigheder.jpg", "Villads med et fjollet udtryk"),
      yt("w5qrYMAt9Jo", "Eksempel på en vittighed"),
      yt("pLbwxrO6cEY", "Endnu en vittighed"),
    ],
    questions: [{ label: "Hvilket nummer skal vittighederne sendes til?", required: true }],
    sampleTestimonials: [
      {
        authorName: "Line",
        emoji: "🙃",
        text: "Dag 3 stønnede jeg højt i toget. Dag 5 grinede jeg. Dag 7 savnede jeg dem.",
      },
    ],
  },
  {
    slug: "haandskrevet-brev",
    name: "Håndskrevet brev",
    tagline: "Jeg får dig til at føle dig beskrevet",
    headline: "Et personligt brev om dig og mig",
    summary: "Et brev om de ting, vi tænker på, drømmer om og længes efter.",
    description:
      "Hvis du har det ligesom jeg: som ung voksen, der burde have nået mere i sit liv, som kulturløs dansker med ekstreme privilegier i alle henseender – og alligevel føler dig ensom. Behov for ingen, og ingen efterspørger én. Så er man efterladt med en overfladisk hob af smil og ingen gæster, der kommer uanmeldt forbi, ej heller invitationer til ren og skær hygge.\n\nOm sommeren er folk hungrige efter samvær, men resten af året er vi optaget af vores fuldtidsarbejde eller af at se serier. For at stikke lidt i en gammel indtørret lort, vil jeg skrive et brev til dig om de ting, vi tænker på, drømmer om og længes efter.",
    delivery: "Brevet fragtes til dig – du kan også få det på mail.",
    emoji: "✉️",
    color: "#7bdff2",
    category: "ord-fra-hjertet",
    price: 940,
    legacyPath: "/start/om-tjenesterne/et-håndskrevet-brev",
    media: [img("haandskrevet-brev.jpg", "Et håndskrevet brev med tegning")],
    questions: [
      { label: "Hvilken adresse skal brevet sendes til?", kind: "textarea", required: true },
      { label: "Er der noget, du gerne vil have, at brevet handler om?", kind: "textarea" },
    ],
    sampleTestimonials: [
      {
        authorName: "Sofie",
        emoji: "💌",
        text: "Jeg har ikke fået et rigtigt brev siden 2009. Det hænger nu på mit køleskab.",
      },
    ],
  },
  {
    slug: "jeg-tager-skylden",
    name: "Jeg tager skylden",
    tagline: "Jeg tager din skyld på mig",
    headline: "Jeg vil være Sorteper for hvad end du har gjort",
    summary: "Du har gjort noget dumt. Nu får du en syndebuk. Det er mig!",
    description:
      "For nyligt – eller måske forleden – har du gjort noget dumt. Du tør ikke sige det til din mor eller indrømme det over for din kæreste. Dine venner ved ikke engang, at det var dig. Nu får du muligheden for en syndebuk. Det er mig!\n\nEngang imellem træder man i spinaten. Du kan ikke finde ud af at formulere, at det var dig, der sked på gulvet, og ikke katten – alle de år tilbage. Din samvittighed er tynget, og der kommer jeg til undsætning. Jeg påtager mig skylden. Jeg er professionel udi skyldfølelse og har gode argumenter for, hvorfor det er min skyld.",
    finePrint:
      "I tilfælde hvor forsikring og/eller fængselsstraf er involveret, kan jeg kun sende mine mest dybfølte tanker.",
    emoji: "🙋",
    color: "#ff9f1c",
    category: "smaa-tanker",
    price: 590,
    featured: true,
    legacyPath: "/start/om-tjenesterne/jeg-tager-skylden",
    questions: [
      { label: "Hvad har du (jeg) gjort?", kind: "textarea", required: true },
      { label: "Hvem skal jeg tilstå over for?" },
    ],
    sampleTestimonials: [
      {
        authorName: "Anders",
        emoji: "😇",
        text: "Min mor tror nu, at det var Villads, der bakkede ind i postkassen i 2014. Hun har tilgivet ham.",
      },
    ],
  },
  {
    slug: "baenk",
    name: "Sidde på en bænk for dig",
    tagline: "Jeg venter på dig",
    headline: "Jeg vil sidde på en bænk \"med dig\"",
    summary: "En helt unik bænkoplevelse og bænklokation – kun til dig.",
    description:
      "Jeg tager bussen, toget eller cyklen ud til et mere eller mindre øde sted. Medbragt har jeg madpakke og en bog. Jeg finder en bænk og sætter mig på den. Jeg læser min bog, spiser min madpakke og skriver dit navn på bænken (ulovligt, så gå stille med dørene) – eller, hvis politiet spørger, på et træ i nærheden. Jeg sender dig geolokationen på bænken sammen med et billede.\n\nHver bænk er unik, og jeg sidder kun på den samme bænk én gang. Du får altså den helt unikke bænkoplevelse helt for dig selv.",
    finePrint: "De fleste bænkoplevelser vil foregå i Region Midtjylland.",
    delivery: "Du modtager billede og geolokation digitalt.",
    emoji: "🪑",
    color: "#4d96ff",
    category: "smaa-tanker",
    price: 640,
    legacyPath: "/start/om-tjenesterne/sidde-på-en-bænk-for-dig",
    media: [img("baenk.jpg", "En blå bænk ved et vejskilt")],
    questions: [{ label: "Hvilket navn skal stå på bænken?", required: true }],
    sampleTestimonials: [
      {
        authorName: "Ida",
        emoji: "🌳",
        text: "Der står \"IDA\" på en bænk ved Gudenåen nu. Jeg har været der to gange. Den er min.",
      },
    ],
  },
  {
    slug: "besoeg-din-ven",
    name: "Besøg en ven for dig",
    tagline: "Jeg besøger din ven",
    headline: "Jeg besøger en af dine venner til kaffe og småsnak",
    summary: "Er du flyttet langt væk? Så er jeg din repræsentant.",
    description:
      "Hvis du er en af dem, der er flyttet til et andet land – fx København – så kan jeg være din repræsentant i Aarhus. Jeg besøger venner, der bor langt fra dig, får en hyggelig snak med dem og taler meget om dig, så de ikke glemmer dig helt.\n\nDu giver mig adressen på en ven. Så tager jeg derhen og banker på døren. Jeg smiler og hilser høfligt. Måske en lille småsten op på ruden og et lille kald: \"Hey, Grethe, er du der?\" – hvis hun nu ikke åbner.\n\nJeg indleder samtalen og giver information videre, som du har instrueret mig i. Jeg advarer din ven på forhånd, hvis du vil. Selvfølgelig er jeg imødekommende og snakkesalig og kan fornemme, hvornår jeg skal gå igen. Hvis din ven er sød, bliver jeg måske venner med vedkommende.",
    finePrint:
      "Maksimal besøgstid er 3 timer. Hvis vennen ikke åbner døren, skriver jeg en besked og kaster den i brevsprækken.",
    emoji: "☕",
    color: "#6bcb77",
    category: "jeg-dukker-op",
    price: 1340,
    featured: true,
    legacyPath: "/start/om-tjenesterne/besøge-en-gammel-ven-for-dig",
    media: [
      img("besoeg-din-ven.png", "Villads på besøg hos en ven med kaffe", {
        isExample: true,
        caption: "Eksempel fra en tidligere køber",
      }),
    ],
    questions: [
      { label: "Navn og adresse på din ven", kind: "textarea", required: true },
      { label: "Hvad skal jeg fortælle om dig?", kind: "textarea" },
      { label: "Skal jeg advare din ven på forhånd?" },
    ],
    sampleTestimonials: [
      {
        authorName: "Grethe",
        emoji: "🫖",
        text: "Der bankede en fremmed mand på og talte i to timer om min veninde i København. Vi ses nu hver tirsdag.",
      },
    ],
  },
  {
    slug: "mad-til-hjemloese",
    name: "Mad til en hjemløs",
    tagline: "Jeg gør gode ting i dit navn",
    headline: "Jeg køber mad til en hjemløs",
    summary: "Du vælger selv beløbet – det skal bare ende på ,25.",
    description:
      "Jeg tager til togstationen eller hen til varmestuen. Her uddeler jeg mad. Jeg får samtykke til at tage et billede som tak for maden og sender det til dig. Måske får jeg en ny ven med i købet.\n\nMaden bliver købt for det beløb, du overfører. Jeg sender dokumentation for den købte mad med kvittering.",
    finePrint: "Hvis samtykke fra den hjemløse ikke kan gives, får du bare et billede af maden.",
    emoji: "🥪",
    color: "#ffb4a2",
    category: "gode-gerninger",
    priceKind: "custom",
    price: 20025,
    priceEndsWith: 25,
    minPrice: 5025,
    legacyPath: "/start/om-tjenesterne/mad-til-en-hjemløs",
    media: [img("mad-til-hjemloese.gif", "Mad over bål")],
    sampleTestimonials: [
      {
        authorName: "Peter",
        emoji: "🥰",
        text: "Jeg fik et billede af Bent med en stor sandwich og et kæmpe smil. Bedste 200,25 kr. jeg har brugt.",
      },
    ],
  },
  {
    slug: "stykke-af-himlen",
    name: "Et stykke af himlen",
    tagline: "Jeg giver dig et stykke af himlen",
    headline: "Jeg indfanger et stykke himmel til dig",
    summary: "Et højopløst foto af himlen og en geolokation – kun til dig.",
    description:
      "Med tankerne højt oppe fordyber jeg mig i tanker om menneskeheden og vores korte liv. Jeg hører fugle og mærker vinden. Jeg misser med øjnene og skuer mod horisonten. Jeg tager ud i verden og giver dig en geolokation for stedet. Du får et højopløst fotografi af himlen derfra. Mere himmel end jord – måske endda kun himmel. Ingen bygninger eller måger. Måske bygninger og måger – det vigtigste er dig og himlen.\n\nDu kommer aldrig til at se himlen på samme måde igen.",
    delivery: "Foto og geolokation leveres digitalt.",
    emoji: "🌤️",
    color: "#9bf6ff",
    category: "smaa-tanker",
    price: 140,
    legacyPath: "/start/om-tjenesterne/et-stykke-af-himlen",
    media: [
      img("stykke-af-himlen.gif", "Gæs der flyver over en landevej"),
      img("stykke-af-himlen-eksempel.png", "Mail med et leveret stykke himmel", {
        isExample: true,
        caption: "Sådan ser et leveret stykke himmel ud",
      }),
    ],
    sampleTestimonials: [
      {
        authorName: "Emil",
        emoji: "☁️",
        text: "Det var en sky, der lignede en kanin. Han skrev, at den lignede mig. Jeg tager det som en kompliment.",
      },
    ],
  },
  {
    slug: "taenk-paa-dig",
    name: "Tænke på dig i et minut",
    tagline: "Jeg tænker på dig",
    headline: "Jeg vil tænke på dig i et minut",
    summary: "Luk øjnene og vid, at nogen derude tænker på dig.",
    description:
      "Luk øjnene og vid, at nogen derude tænker på dig. Jeg er den person. Bare slap af. Jeg er her, og jeg vil tænke på dig. Du er en vigtig og gyldig person. I mit liv i hvert fald – i et minut som minimum.",
    emoji: "💭",
    color: "#ffc6ff",
    category: "smaa-tanker",
    price: 120,
    legacyPath: "/start/om-tjenesterne/tænke-på-dig-i-et-minut",
    variants: [
      { name: "Ét minut med lukkede øjne", price: 120 },
      { name: "Ét minut mens jeg kigger på et billede af dig", price: 220 },
      { name: "Ét minut på et tidspunkt du vælger (jeg sætter en alarm)", price: 320 },
      { name: "Ét minut mens jeg laver noget, du vælger", price: 420 },
      { name: "Langt mere end et minut", price: 520 },
      { name: "Engang imellem, forskellige længder af tid – altid med et smil", price: 620 },
    ],
    media: [img("taenk-paa-dig.gif", "Villads der tænker")],
    questions: [{ label: "Tidspunkt, billede eller aktivitet (hvis din variant kræver det)" }],
    sampleTestimonials: [
      {
        authorName: "Nanna",
        emoji: "🫶",
        text: "Kl. 14.32 en tirsdag vidste jeg, at nogen tænkte på mig. Jeg fik gåsehud.",
      },
    ],
  },
  {
    slug: "ceremoni",
    name: "Deltage i din ceremoni",
    tagline: "Jeg dukker faktisk op",
    headline: "Jeg kommer til din begravelse etc.",
    summary: "Fødselsdage, bryllupper, begravelser, fodboldkampe – jeg er der!",
    description:
      "I dette ene liv har du nogle milepæle, som er vigtige at dele med andre. Din fødsel kan jeg ikke deltage i – det kan jeg forklare senere. Men til alle dine fødselsdagsfejringer, religiøse ritualer, bryllupper og andre kærlighedsfester, begravelser og ligafbrændinger, fodboldkampe eller andre begivenheder, hvor du har en central rolle: Jeg er der!\n\nJeg kan stå i baggrunden eller være din største repræsentant – hvad du nu vælger. Jeg kan holde tale eller fremstå mystisk – som en hemmelig ven fra dit dobbeltliv. Hvad som helst kan lade sig gøre.",
    finePrint:
      "Jeg kan desværre kun deltage i begivenheder i Danmark, medmindre du lægger 21.000 kr. oveni til at dække transportudgifterne.",
    emoji: "🎩",
    color: "#c77dff",
    category: "jeg-dukker-op",
    price: 2040,
    legacyPath: "/start/om-tjenesterne/deltage-i-din-ceremoni",
    media: [img("ceremoni.gif", "Villads til en ceremoni")],
    questions: [
      { label: "Hvilken begivenhed?", required: true },
      { label: "Hvornår?", kind: "datetime", required: true },
      { label: "Adresse", required: true },
      { label: "Skal jeg holde tale, stå i baggrunden eller fremstå mystisk?" },
    ],
    sampleTestimonials: [
      {
        authorName: "Rasmus",
        emoji: "🕶️",
        text: "Ingen til mit bryllup vidste, hvem han var. Han holdt en tale om \"de gamle dage i Marseille\". Jeg har aldrig været i Marseille.",
      },
    ],
  },
  {
    slug: "billede-i-mit-hjem",
    name: "Et billede af dig i mit hjem",
    tagline: "Jeg ser på dig hver dag",
    headline: "Jeg vil have noget med dit ansigt på i mit hjem",
    summary: "Dit ansigt på min væg, min pude, min T-shirt eller i guldramme.",
    description:
      "Hvis du er en ægte ven, så vil du være på min væg, i min sofa, ved mit natbord, på køleskabet eller lignende. Jeg får fremkaldt et flot billede eller print af dig – på en pude, en musemåtte, et klistermærke, i en guldramme, på en T-shirt eller lignende. Jeg hænger dit billede op eller placerer dig centralt i mit hjem. Du vil pryde mit hjem i lige så mange uger, som du vil.",
    finePrint: "Jeg vil (måske) frabede mig nøgenbilleder.",
    emoji: "🖼️",
    color: "#ffd166",
    category: "smaa-tanker",
    price: 110,
    legacyPath: "/start/om-tjenesterne/et-billede-af-dig-i-mit-hjem",
    variants: [
      { name: "Dit ansigt som baggrundsbillede", price: 110 },
      { name: "Dit ansigt på lille foto", price: 410 },
      { name: "Dit ansigt på kæmpe foto", price: 810 },
      { name: "Dit ansigt på pude", price: 5010 },
      { name: "Dit ansigt i maskinbroderi", price: 6010 },
      { name: "Dit ansigt på T-shirt", price: 9010 },
      { name: "Dit ansigt i perler", price: 11010 },
      { name: "Dit ansigt i guldramme", price: 12010 },
    ],
    media: [
      img("billede-i-mit-hjem.jpg", "Collage af ansigter"),
      img("billede-i-mit-hjem-eksempel.png", "Et billede af en køber hængt op på væggen", {
        isExample: true,
        caption: "En køber der nu bor på min væg",
      }),
    ],
    questions: [{ label: "Hvor kan jeg hente et billede af dig? (link, eller send det bagefter)" }],
    sampleTestimonials: [
      {
        authorName: "Frederik",
        emoji: "🛋️",
        text: "Mit ansigt er på en pude i hans sofa. Hans kæreste har spurgt, hvem jeg er. Jeg er en ægte ven.",
      },
    ],
  },
  {
    slug: "kaerlighedsraad",
    name: "Kærlighedsrådgivning",
    tagline: "Jeg får dine forhold til at holde",
    headline: "Jeg hjælper dig med dit crush",
    summary: "Dating-tips, dybe sandheder og skærmbillede-analyse.",
    description:
      "Jeg lytter til din historie og læser gerne screenshots af sms-tråde. Derudfra guider jeg dig frem til at lykkes i kærligheden – hvad end det er ind i den eller ud af den. Jeg vil trøste og sige dybe ting såsom: \"Hvis han elsker dig, så vil du vide det, og hvis ikke, vil du være forvirret.\"\n\nJeg er til rådighed på WhatsApp, Telegram, Skype, Zello (en slags walkie-talkie) – eller hvad end du er til – altid klar til at fortælle om faresignaler eller muligheder for romantik.",
    finePrint: "Du kan desværre ikke bestille henrettelser gennem denne tjeneste.",
    emoji: "💘",
    color: "#ff70a6",
    category: "smaa-tanker",
    price: 240,
    legacyPath: "/start/om-tjenesterne/kærlighedsrådgivning",
    media: [img("kaerlighedsraad.gif", "Hjerter på en lyserød dør")],
    questions: [
      { label: "Hvor vil du helst snakke? (WhatsApp, Telegram, Zello …)", required: true },
      { label: "Kort om situationen", kind: "textarea" },
    ],
    sampleTestimonials: [
      {
        authorName: "Camilla",
        emoji: "💞",
        text: "Han sagde \"Hvis du skal spørge, kender du svaret.\" Jeg slog op. Nu er jeg lykkelig. Med en anden.",
      },
    ],
  },
  {
    slug: "politisk-tale",
    name: "Politisk tale",
    tagline: "Jeg kæmper din sag",
    headline: "Jeg vil være politisk aktiv for din sag",
    summary: "Jeg taler højt og tydeligt om det, du brænder for.",
    description:
      "Du går op i noget. Noget du brænder for, og det vil jeg også brænde for. Som din ven tager jeg til nærmeste offentlige bygning – ambassade, kommunekontor, bibliotek eller sågar et busstoppested. Jeg taler om det, du brænder for, og læser højt og tydeligt, så alle kan høre det. Jeg får talen optaget på video til senere viral distribution.",
    finePrint:
      "Det er desværre ikke muligt at bruge mig som talerør til at mobbe. Kun venstreorienterede sager, tak.",
    emoji: "📣",
    color: "#ef476f",
    category: "gode-gerninger",
    price: 740,
    legacyPath: "/start/om-tjenesterne/politisk-tale",
    media: [img("politisk-tale.jpg", "Villads i en samtale")],
    questions: [{ label: "Hvad er din sag?", kind: "textarea", required: true }],
    sampleTestimonials: [
      {
        authorName: "Asger",
        emoji: "✊",
        text: "Han holdt en 8 minutters tale om cykelstier ved et busstoppested i Viby. Tre mennesker klappede. Bussen kom ikke.",
      },
    ],
  },
  {
    slug: "et-minde",
    name: "Et minde af mine",
    tagline: "Jeg deler mit liv med dig",
    headline: "Jeg giver dig et minde for evigt",
    summary: "Eje et minde, jeg har haft. Antikke minder, på en måde.",
    description:
      "Mod betaling kan du hente et minde fra mit liv, som for evigt kan være dit. Jeg vil herefter kun tænke på dette minde i forbindelse med dig. Jeg nedfælder mindet og sender det til dig. Det vil være et godt, gammelt minde – et der betyder noget – og mere end et år gammelt. Det er sgu da spændende!\n\nJeg vil formentlig have brug for at aktivere minderne med dufte, genstande eller intens erindring. Sådan er det med gamle minder, når man skal hente dem frem. Antikke minder, på en måde.",
    finePrint:
      "Der kan forekomme små detaljer i mindet, som ikke er 100 % tro mod den pågældende situation. Det er svært at vide præcis, hvad der er et minde, og hvad der er fundet på i øjeblikket.",
    emoji: "🧠",
    color: "#b8c0ff",
    category: "ord-fra-hjertet",
    price: 250,
    legacyPath: "/start/om-tjenesterne/et-minde-af-mine",
    media: [img("et-minde.jpg", "Et gammelt minde i sort-hvid")],
    sampleTestimonials: [
      {
        authorName: "Laura",
        emoji: "🗝️",
        text: "Jeg ejer nu hans minde om en sommeraften i 1998 med en flødebolle og en tabt sandal. Det er mit nu.",
      },
    ],
  },
  {
    slug: "fremstaa-sej",
    name: "Fremstå sej",
    tagline: "Jeg giver dig selvtillid",
    headline: "Jeg kommer op at slås med dig – og taber",
    summary: "Du fremstår som en værre satan. Garanteret.",
    description:
      "Hvis du gerne vil fremstå som en helvedes karl, så kan jeg tage solbriller og læderjakke/wifebeater på og råbe nogle provokerende ting til dig, mens dine venner ser på. Jeg har købt energidrik og lært at tale randersiansk. Så reagerer du med et på forhånd aftalt tilråb, hvortil jeg begynder at græde og siger undskyld. ELLER: Du kan komme og tæve mig, fordi jeg provokerede dig.\n\nUanset hvad vil du fremstå som en værre satan.",
    finePrint:
      "Det er desværre ikke muligt at påføre mig varig skade. Det har vist sig ikke rigtig at være gavnligt for venskabet.",
    emoji: "😎",
    color: "#073b4c",
    category: "jeg-dukker-op",
    price: 700,
    legacyPath: "/start/om-tjenesterne/fremstå-sej",
    variants: [
      { name: "Den hvor jeg græder" },
      { name: "Den hvor du græder" },
      { name: "Den hvor vi begge græder" },
      { name: "Den hvor jeg siger undskyld bagefter" },
      { name: "Den hvor jeg flygter" },
    ],
    media: [img("fremstaa-sej.jpg", "Villads med store øjne")],
    questions: [
      { label: "Hvor og hvornår?", required: true },
      { label: "Hvilket tilråb aftaler vi?" },
    ],
    sampleTestimonials: [
      {
        authorName: "Mikkel",
        emoji: "💪",
        text: "Jeg sagde \"Smut med dig\", og han flygtede grædende. Min kæreste siger, jeg er blevet mere attraktiv.",
      },
    ],
  },
  {
    slug: "husligt-hjaelp",
    name: "Husligt hjælp",
    tagline: "Jeg gør dit liv overskueligt",
    headline: "Jeg kommer forbi og hjælper dig i dit hjem",
    summary: "Slagboremaskine, rawplugs, vaterpas – og selskab.",
    description:
      "Denne klassiske tjeneste involverer slagboremaskine, rawplugs, skruemaskine og vaterpas. Du bestemmer selv, hvor der skal hænges noget op, og vi er sammen gennem hele processen. En rigtig venneting!",
    emoji: "🔧",
    color: "#06d6a0",
    category: "praktisk-venskab",
    price: 10050,
    legacyPath: "/start/om-tjenesterne/husligt-hjælp",
    variants: [
      { name: "Hænge lamper op" },
      { name: "Støvsuge" },
      { name: "Tage opvasken" },
      { name: "Tælle om der mangler brikker i puslespillet" },
      { name: "Fylde skruehuller med spartelmasse" },
      { name: "Marie Kondo-smid-ud-gennemgang" },
    ],
    media: [img("husligt-hjaelp.jpg", "En skruetrækker og en seddel")],
    questions: [
      { label: "Adresse", required: true },
      { label: "Hvornår passer det dig?", kind: "datetime" },
    ],
    sampleTestimonials: [
      {
        authorName: "Birgitte",
        emoji: "🧩",
        text: "Der manglede 3 brikker. Han fandt de 2 under sofaen. Den sidste leder vi stadig efter – sammen.",
      },
    ],
  },
  {
    slug: "personlig-sang",
    name: "En personlig sang",
    tagline: "Jeg er sårbar over for dig",
    headline: "Jeg vil synge for dig",
    summary: "Originale sange skrevet og sunget af mig. Aldrig hørt før!",
    description:
      "1-til-1-sang (ingen grupper eller events). Originale sange skrevet og sunget af mig, med sangtekster om alt mellem himmel og jord. Aldrig hørt før!\n\nSangene bliver indspillet med professionelt udstyr og sendt til dig.",
    finePrint: "Alle sange er underlagt overhovedet ingen form for beskyttelse.",
    delivery: "Sangen sendes digitalt.",
    emoji: "🎤",
    color: "#f15bb5",
    category: "ord-fra-hjertet",
    price: 300,
    legacyPath: "/start/om-tjenesterne/en-personlig-sang",
    media: [img("personlig-sang.png", "Villads der synger af fuld hals")],
    questions: [{ label: "Hvad skal sangen handle om?", kind: "textarea" }],
    sampleTestimonials: [
      {
        authorName: "Julie",
        emoji: "🎶",
        text: "Sangen hed \"Julie, du har en flot cykel\". Omkvædet sidder fast i hele min familie.",
      },
    ],
  },
  {
    slug: "some-manager",
    name: "SoMe-manager",
    tagline: "Jeg får folk til at synes om dig",
    headline: "Lad mig uploade et par selviscenesættende posts",
    summary: "5 opslag på en uge om dig og dine produkter.",
    description:
      "Hen over minimum en uge laver jeg 5 opslag om dig og dine produkter. De vil være målrettet den målgruppe, som vil have gavn af dit produkt eller din service. Det skal være noget, der gør verden et bedre sted. Hvis dit produkt ikke gør verden et bedre sted, så vil jeg ikke fremme det.\n\nEfter betaling er det vigtigt, at vi holder et videomøde, hvor vi sammen sætter dine konti op.",
    finePrint:
      "Du kan forvente 100 % fortrolighed, og jeg hjælper dig efterfølgende med at lave nye kodeord.",
    emoji: "📱",
    color: "#00bbf9",
    category: "praktisk-venskab",
    price: 1900,
    legacyPath: "/start/om-tjenesterne/some-manager",
    variants: [
      { name: "Opslag af personlig karakter, fx på din Instagram" },
      { name: "Opslag for din lille biks, fx på Google Maps" },
      { name: "Opslag med konkurrencer, kampagner osv." },
      { name: "Styring af dine chatkanaler og kundeservice" },
      { name: "Besvarelse af sms'er og mails" },
    ],
    media: [img("some-manager.jpg", "En computer på et skrivebord")],
    sampleTestimonials: [
      {
        authorName: "Henrik",
        emoji: "📈",
        text: "Min keramikbiks fik 40 nye følgere. Han skrev \"Denne skål har set ting\" under et billede af en skål.",
      },
    ],
  },
  {
    slug: "foedselsdag",
    name: "Kom til min fødselsdag",
    tagline: "Jeg vil have dig i mit liv",
    headline: "Jeg inviterer dig til min fødselsdag",
    summary: "Fordi du er min tro ven, der giver mig lige i underkanten af 8 kr.",
    description:
      "Fordi du er min tro ven, som giver mig lige i underkanten af 8 kr., så må du komme med til min fødselsdag!\n\nFakta: Jeg er født 21. oktober 1986. Hver dag er i teorien min fødselsdag – i morgen, for eksempel. Vælg den runde dag, du helst vil fejre.",
    emoji: "🎂",
    color: "#ff595e",
    category: "jeg-dukker-op",
    price: 790,
    legacyPath: "/start/om-tjenesterne/kom-til-min-fødselsdag",
    variants: [
      { name: "40 år – 21. oktober 2026" },
      { name: "15.000 dages fødselsdag – 15. november 2027" },
      { name: "500 måneders fødselsdag – 21. juni 2028" },
      { name: "16.000 dages fødselsdag – 11. august 2030" },
      { name: "600 måneders fødselsdag – 21. oktober 2036" },
      { name: "3.000 ugers fødselsdag – 19. april 2044" },
      { name: "En helt tilfældig dag (i morgen?)" },
    ],
    media: [img("foedselsdag.jpg", "En kage pyntet med slik og flag")],
    sampleTestimonials: [
      {
        authorName: "Thomas",
        emoji: "🥳",
        text: "Jeg fejrede hans 14.000 dages fødselsdag. Der var flødeboller og en tale om tid. Jeg har booket 15.000.",
      },
    ],
  },
  {
    slug: "vanding-af-blomster",
    name: "Vanding af blomster",
    tagline: "Jeg vander dine blomster",
    headline: "Jeg passer dine blomster, mens du er på ferie",
    summary: "Jeg ved præcis, hvor meget vand de skal have.",
    description:
      "Hvis du skal på ferie, kan jeg komme forbi og vande dine planter. Jeg ved præcis, hvor meget vand de skal have.",
    finePrint: "Dine planter dør muligvis.",
    emoji: "🌱",
    color: "#8ac926",
    category: "praktisk-venskab",
    price: 690,
    legacyPath: "/start/om-tjenesterne/vanding-af-blomster",
    questions: [
      { label: "Adresse og hvordan jeg kommer ind", kind: "textarea", required: true },
      { label: "Hvilken periode er du væk?", required: true },
    ],
    sampleTestimonials: [
      {
        authorName: "Karen",
        emoji: "🪴",
        text: "Min monstera lever. Min basilikum gør ikke. 50 % overlevelse er bedre end sidste år.",
      },
    ],
  },
  {
    slug: "undskyldning",
    name: "En tilpasset undskyldning",
    tagline: "Jeg beklager",
    headline: "Jeg siger undskyld for dig eller til dig",
    summary: "Den længe ventede, dybtfølte undskyldning, du fortjener.",
    description:
      "Jeg skriver en dansksproget undskyldning til nogen, som fortjener det. Jeg kan også give mig ud for at være én, der skylder dig en undskyldning, og give dig den længe ventede, dybtfølte undskyldning, du fortjener.\n\nHvad end der trænger til en god forklaring og et løfte om forbedring – så er jeg på opgaven!",
    finePrint:
      "Jeg tager ikke skylden – der henviser jeg til tjenesten \"Jeg tager skylden\". Hvis jeg skal henvende mig til andre end dig med undskyldningen, er det min pligt at oplyse dem om, at det er en forbeholden undskyldning, idet jeg ikke kan gøre det godt igen.",
    emoji: "🙏",
    color: "#bdb2ff",
    category: "ord-fra-hjertet",
    price: 490,
    legacyPath: "/start/om-tjenesterne/en-tilpasset-undskyldning",
    questions: [
      { label: "Hvem skal undskylde til hvem – og for hvad?", kind: "textarea", required: true },
    ],
    sampleTestimonials: [
      {
        authorName: "Mads",
        emoji: "🫡",
        text: "Jeg har ventet 11 år på, at min bror undskyldte for Pokémon-kortene. Villads gjorde det bedre end ham.",
      },
    ],
  },
  {
    slug: "event-design",
    name: "Event design",
    tagline: "Jeg sørger for festen",
    headline: "Jeg står for din begivenhed",
    summary: "Fødselsdag, konfirmation, bryllup, begravelse eller gamer-aften.",
    description:
      "Jeg laver et event for dig. Din fødselsdag, din konfirmation, dit bryllup, et event for dine venner, din begravelse eller lignende.\n\nSærlige anledninger: begravelser, gamer-aftener, 3.g-dimissionsfester, brætspilsaftener og skoleklassegenforeninger.",
    emoji: "🎊",
    color: "#ffca3a",
    category: "praktisk-venskab",
    price: 90000,
    legacyPath: "/start/om-tjenesterne/event-design",
    variants: [
      { name: "Begivenhed for 2 personer" },
      { name: "Begivenhed for 4 personer" },
      { name: "Begivenhed for 300–700 personer" },
      { name: "Begivenhed for børn" },
    ],
    media: [img("event-design.jpg", "To personer på en skovsti ved en opslagstavle")],
    questions: [
      { label: "Hvilken anledning?", required: true },
      { label: "Dato", kind: "date" },
      { label: "Fortæl om dine ønsker", kind: "textarea" },
    ],
    sampleTestimonials: [
      {
        authorName: "Signe",
        emoji: "🎈",
        text: "Skoleklassegenforening for 2. b. Han havde lavet navneskilte med vores gamle kælenavne. Nogen græd.",
      },
    ],
  },
  {
    slug: "studieplads",
    name: "Studieplads",
    tagline: "Jeg interesserer mig for din fremtid",
    headline: "Jeg vil være din studiekammerat",
    summary: "Mad, kaffe, varme, hjælp og pausestyring – hver dag 10–17.",
    description:
      "Du kan hver dag mellem kl. 10 og 17 komme op og studere i min lejlighed i Aarhus. Jeg har mad, kaffe, varme, hjælp, pausestyring og rolige omgivelser.\n\nJeg sætter mig ind i dit fag eller din opgave – hvad end det er Biblen, økonomi, biologi eller danske digte.",
    finePrint:
      "Der kan desværre ikke hjælpes med tysk grammatik pga. problemer med tysk grammatik. Helt specifikt er tysk grammatik bare for kedeligt.",
    emoji: "📚",
    color: "#4cc9f0",
    category: "praktisk-venskab",
    price: 100,
    legacyPath: "/start/om-tjenesterne/studieplads",
    media: [img("studieplads.jpg", "En bærbar computer på et spisebord")],
    questions: [
      { label: "Hvilken dag vil du komme?", kind: "date", required: true },
      { label: "Hvad studerer du?" },
    ],
    sampleTestimonials: [
      {
        authorName: "Oliver",
        emoji: "☕",
        text: "Jeg skrev min bacheloropgave hos ham på 1 kr. om dagen. Pausestyringen er hård, men retfærdig.",
      },
    ],
  },
  {
    slug: "taeppevask",
    name: "Tæppevask",
    tagline: "Jeg går op i dit indeklima",
    headline: "Jeg kommer med min vådsuger og skrubber",
    summary: "Jeg renser ethvert slags tekstil i dit hjem.",
    description:
      "Jeg renser ethvert slags tekstilprodukt, du har i dit hjem – tæpper, sofaer, bilsæder og gulve. Du skal fortælle mig, hvor du bor, så jeg kan komme og vaske det.",
    finePrint:
      "Hvis dit tæppe, din bil, din sofa eller dit gulv ikke er 100 % perfekt bagefter, så hold din kæft – for jeg har gjort det af ren og skær venlighed. Jeg er klart din bedste ven, så jeg fortjener ikke at høre på dit pis.",
    emoji: "🧽",
    color: "#72efdd",
    category: "praktisk-venskab",
    priceKind: "per_unit",
    price: 5000,
    unitLabel: "m²",
    legacyPath: "/start/om-tjenesterne/tæppevask",
    media: [
      img("taeppevask.gif", "Vådsugning af et tæppe"),
      yt("-UX0MWUz5vs", "Tæppevask i aktion"),
      yt("E21rd_GyKLM", "Før og efter"),
    ],
    questions: [
      { label: "Adresse", required: true },
      { label: "Hvad skal vaskes?" },
    ],
    sampleTestimonials: [
      {
        authorName: "Lone",
        emoji: "✨",
        text: "Rødvinspletten fra nytår 2019 er væk. Han sagde, at jeg skulle holde min kæft, hvis den ikke var. Den var væk.",
      },
    ],
  },
  {
    slug: "godnathistorie",
    name: "Godnathistorie",
    tagline: "Jeg luller dig i søvn",
    headline: "Jeg laver din helt egen godnathistorie",
    summary: "En indtalt historie til børn og voksne – nu med 2 timers forsinkelse!",
    description:
      "En historie, som er lavet til oplæsning. Alle kan lytte til den: børn og voksne (og dig også!). Den har elementer af brugbar viden og er uden typiske eventyrelementer som magiske tal og fantasidyr. Den tager udgangspunkt i det postfaktuelle, senpostmoderne samfund, vi lever i. Men historien vil selvfølgelig være positiv.\n\nJeg kan skrive på flere sprog, så længe det er dansk. Forvent barnligt sprog – sprog som er til at forstå for børn.\n\nGrundet stor efterspørgsel kan du nu få godnathistorier med 2 timers forsinkelse!",
    delivery: "Historien indtales og sendes digitalt. Den udgives også på min podcast \"Du bør kommentere\".",
    emoji: "🌙",
    color: "#3a0ca3",
    category: "ord-fra-hjertet",
    price: 2900,
    legacyPath: "/start/om-tjenesterne/godnathistorie",
    media: [img("godnathistorie.png", "Villads læser godnathistorie for et barn")],
    questions: [
      { label: "Hvem er historien til, og hvor gammel er vedkommende?" },
      { label: "Er der noget, historien skal handle om?", kind: "textarea" },
    ],
    sampleTestimonials: [
      {
        authorName: "Maria",
        emoji: "😴",
        text: "Historien handlede om en skraldebil, der lærte om kompost. Min søn sov efter 4 minutter. Jeg lyttede færdig.",
      },
    ],
  },
  {
    slug: "cykelruter",
    name: "Cykel- eller vandrerute",
    tagline: "Jeg tager dig ud i verden",
    headline: "Jeg laver en cykel- eller vandrerute til dig",
    summary: "En planlagt tur fra hvor som helst i Europa til hvor som helst i Europa.",
    description:
      "Giv mig mindst to ugers forberedelse, så planlægger jeg en tur for dig fra hvor som helst i Europa til hvor som helst i Europa – på cykel eller til fods.\n\nTil vandring planlægger jeg 10 km pr. dag af din rejse. Til cykling planlægger jeg 30 km pr. dag. Undervejs fortæller jeg dig om de kulturelle omgivelser, du kan se eller opleve.\n\nTidligere ruter: Spanien, ned igennem England, rundt om Nordsøen, Irland frem og tilbage – og Frankrig.",
    emoji: "🚲",
    color: "#2ec4b6",
    category: "praktisk-venskab",
    price: 1830,
    legacyPath: "/start/om-tjenesterne/cykelruter",
    variants: [{ name: "Cykelrute (30 km pr. dag)" }, { name: "Vandrerute (10 km pr. dag)" }],
    media: [img("cykelruter.jpg", "Villads på en rød motorcykel")],
    questions: [
      { label: "Hvornår er rejsen planlagt?", kind: "date", required: true },
      { label: "Hvor starter og slutter du?", required: true },
    ],
    sampleTestimonials: [
      {
        authorName: "Søren",
        emoji: "🗺️",
        text: "Rundt om Nordsøen på 6 uger. Han havde skrevet \"husk sardiner\" ved dag 23. Han havde ret.",
      },
    ],
  },
  {
    slug: "to-do-liste",
    name: "Vores to-do i det næste år",
    tagline: "Jeg gør dit liv fuldendt",
    headline: "Jeg giver dig en masse at opleve",
    summary: "En skræddersyet oplevelsesliste til dig, din familie – eller dig og mig.",
    description:
      "En tilpasset dosmerseddel og to-do-liste til dig, dit barn, din familie, dine venner – eller dig og mig.\n\nFortæl mig lidt om dig, og lad mig inspirere dig til at få det meste ud af dit liv. Jeg vil gøre dig effektiv, beriget og værdsat af alle. Der er så meget, du ikke vidste, du kunne opleve og længes efter at opleve.",
    emoji: "✅",
    color: "#80ed99",
    category: "praktisk-venskab",
    price: 25030,
    legacyPath: "/start/om-tjenesterne/vores-to-do-i-det-næste-år",
    variants: [
      { name: "En to-do-liste til dit barn i 2–4-årsalderen" },
      { name: "En oplevelsesliste til dig og din partner de næste fem år" },
      { name: "En eventyrliste med udflugter til dig og en ven (fx mig) det næste år" },
      { name: "En personlig selvudviklingsrejse for dig selv" },
    ],
    media: [
      img("to-do-liste.gif", "En håndskrevet to-do-liste"),
      img("to-do-liste-eksempel.jpg", "En indrammet liste", { isExample: true, caption: "En færdig liste i ramme" }),
    ],
    questions: [{ label: "Fortæl mig om dig/jer", kind: "textarea", required: true }],
    sampleTestimonials: [
      {
        authorName: "Anna",
        emoji: "📝",
        text: "Punkt 14: \"Spis is i regnvejr.\" Vi gjorde det i går. Vi er på punkt 15 nu.",
      },
    ],
  },
  {
    slug: "hjaelp-din-biks",
    name: "Hjælp din biks",
    tagline: "Jeg sælger for dig",
    headline: "Jeg hjælper dig med din forretning",
    summary: "Jeg tager en vagt, laver en pop-up-bod eller tager med på messe.",
    description:
      "Hvis du har en biks, så kan jeg være den ven, der tager en vagt i butikken, læser mig igennem vrede kundehenvendelser, laver en pop-up-bod eller tager med dig på messe.",
    emoji: "🏪",
    color: "#f9844a",
    category: "praktisk-venskab",
    price: 1290,
    featured: true,
    legacyPath: "/start/om-tjenesterne/hjælp-din-biks",
    variants: [
      { name: "Jeg sælger produkter til mine venner (såkaldt pyramidespil)" },
      { name: "Jeg står med dig en hel dag på et marked" },
      { name: "Jeg køber dit produkt" },
      { name: "Jeg fortæller mine venner om din biks" },
    ],
    media: [img("hjaelp-din-biks.jpg", "Villads ved en bod på gaden")],
    questions: [{ label: "Hvad hedder din biks, og hvad sælger den?", required: true }],
    sampleTestimonials: [
      {
        authorName: "Hanne",
        emoji: "🍯",
        text: "Han solgte 14 glas honning på Ry Marked og fortalte alle kunder, at bierne var \"meget motiverede\".",
      },
    ],
  },
  {
    slug: "gaekkebrev",
    name: "Gækkebrev",
    tagline: "Jeg gi'r chokolade",
    headline: "Jeg skriver et gækkebrev til dig",
    summary: "Vildt nemt at gætte – og så skylder jeg dig chokolade.",
    description:
      "Omtrent på det tidspunkt, hvor der er påske – ja, jeg ved ikke lige, hvornår det er, så lad os bare sige, at det gælder hele året – sender jeg dig et gækkebrev. Det vil være vildt nemt at regne ud, hvem det er fra, og så skylder jeg dig chokolade.",
    finePrint: "Denne tjeneste benytter sig ikke af PostNord.",
    emoji: "🍫",
    color: "#b5838d",
    category: "ord-fra-hjertet",
    price: 390,
    featured: true,
    legacyPath: "/start/om-tjenesterne/gækkebrev",
    media: [
      img("gaekkebrev.jpg", "Et klippet gækkebrev"),
      img("gaekkebrev-eksempel.jpg", "Et gækkebrev med blokbogstaver", { isExample: true, caption: "Et leveret gækkebrev" }),
    ],
    questions: [{ label: "Adresse", kind: "textarea", required: true }],
    sampleTestimonials: [
      {
        authorName: "Clara",
        emoji: "🐣",
        text: "Der var tre prikker og et tegnet overskæg. Jeg gættede ham på 2 sekunder. Chokoladen kom i august.",
      },
    ],
  },
  {
    slug: "adopter-en-laerer",
    name: "Adoptér en lærer",
    tagline: "Jeg er din lærer",
    headline: "Adoptér mig – og jeg vil for evigt være taknemmelig",
    summary: "For kun 5 kr. om dagen hjælper du en lærerstuderende.",
    description:
      "Hej. Jeg er Villads Claes. Jeg er lærerstuderende. For kun 5 kr. om dagen kan du hjælpe mig med mad, husly og den kærlighed, jeg er helt desperat efter.\n\nKøb nu, og modtag daglige opdateringer om, hvordan jeg klarer mig ude i folkeskolen, samt et billede af en hårdtarbejdende lærer, som du kan have som baggrund på din telefon eller printe ud og hænge på dit køleskab.",
    finePrint: "Tjenesten varer én måned.",
    emoji: "🍎",
    color: "#e63946",
    category: "gode-gerninger",
    price: 15100,
    recurringLabel: "pr. måned",
    featured: true,
    legacyPath: "/start/om-tjenesterne/adoptér-en-lærer",
    media: [img("adopter-en-laerer.jpg", "En dreng der laver lektier")],
    sampleTestimonials: [
      {
        authorName: "Lis",
        emoji: "🍏",
        text: "Jeg får en daglig sms fra en folkeskole. I dag lærte 5. a om vulkaner. Jeg føler mig som en stolt mor.",
      },
    ],
  },
  {
    slug: "personlig-assistent",
    name: "Personlig assistent",
    tagline: "Jeg er din assistent",
    headline: "Jeg vil være din personlige assistent",
    summary: "Kalender, møder, to-dos – og madplan og vaner som tilkøb.",
    description:
      "Når du vælger denne tjeneste, er jeg din personlige assistent hver dag. Det kræver, at du deler din kalender og dine sociale platforme med mig. Vi taler om, hvordan du føler dig tryg ved det.\n\nMed din tilladelse planlægger jeg din dag med møder og to-dos. Vælger du planlægnings-tilkøbet, tager jeg mig også af madplan og indkøb. Vælger du mål-tilkøbet, minder jeg dig om de vaner, du skal udføre hver dag.",
    finePrint: "Tjenesten varer én måned.",
    emoji: "📅",
    color: "#577590",
    category: "praktisk-venskab",
    price: 55080,
    recurringLabel: "pr. måned",
    featured: true,
    legacyPath: "/start/om-tjenesterne/personlig-assistent",
    variants: [
      { name: "Basis: kalender og to-dos" },
      { name: "Med planlægning: + madplan og indkøb" },
      { name: "Med mål: + daglige vane-påmindelser" },
    ],
    media: [img("personlig-assistent.jpg", "Villads smiler i en strikket sweater")],
    sampleTestimonials: [
      {
        authorName: "Jesper",
        emoji: "⏰",
        text: "Han flyttede et møde, fordi \"vejret var for godt\". Det var det rigtige valg.",
      },
    ],
  },
  {
    slug: "skan-en-bog",
    name: "Skan og opsummér en bog",
    tagline: "Jeg læser og lærer for dig",
    headline: "Jeg skanner og opsummerer en bog for dig",
    summary: "Jeg er god til at have styr på ting – og jeg elsker at lære.",
    description:
      "Hej. Jeg er god til at have styr på ting, og jeg elsker at lære. Giv mig en bog, så læser jeg den, skanner den ind og skriver en overskuelig opsummering til dig.",
    emoji: "📖",
    color: "#9d4edd",
    category: "praktisk-venskab",
    price: 15200,
    legacyPath: "/start/om-tjenesterne/skan-noget",
    questions: [{ label: "Hvilken bog?", required: true }],
    sampleTestimonials: [
      {
        authorName: "Victor",
        emoji: "🤓",
        text: "Jeg fik \"Krig og fred\" opsummeret på én side. Han skrev \"Mange russere. Lidt fred.\" Perfekt.",
      },
    ],
  },
  {
    slug: "noget-at-snakke-om",
    name: "Noget at snakke om",
    tagline: "Jeg giver dig noget at tænke over",
    headline: "Jeg stiller dig et tankevækkende spørgsmål hver dag i en uge",
    summary: "Et spørgsmål om dagen – på lydbesked, sms eller dm.",
    description:
      "Hver dag i en uge får du en lydbesked, en sms, en dm eller hvad du nu foretrækker. Jeg stiller dig et tankevækkende spørgsmål, og du skal svare. Måske bliver det lærerigt.",
    finePrint: "Denne tjeneste benytter sig ikke af PostNord.",
    emoji: "🗣️",
    color: "#fcbf49",
    category: "ord-fra-hjertet",
    price: 990,
    legacyPath: "/start/om-tjenesterne/noget-at-snakke-om-hver-dag",
    media: [img("noget-at-snakke-om.jpg", "Solsikker i en vase")],
    questions: [{ label: "Hvordan vil du modtage spørgsmålene?", required: true }],
    sampleTestimonials: [
      {
        authorName: "Ellen",
        emoji: "🤔",
        text: "\"Hvis din cykel kunne tale, hvad ville den så klage over?\" Jeg har tænkt over det i tre dage.",
      },
    ],
  },
  {
    slug: "madplan",
    name: "Madplan",
    tagline: "Jeg bestemmer, hvad du skal spise",
    headline: "Jeg planlægger, hvad du skal spise den næste uge",
    summary: "Velafprøvede opskrifter efter sæsonen – også veganske.",
    description:
      "Når du køber denne tjeneste, giver jeg dig velafprøvede opskrifter, som du kan spise i den kommende uge. Opskrifterne tager højde for sæsonens råvarer og veganske præferencer.",
    finePrint: "Jeg køber dog ikke ind for dig … eller laver maden. Tjenesten varer én uge.",
    emoji: "🥗",
    color: "#52b788",
    category: "praktisk-venskab",
    price: 1080,
    legacyPath: "/start/om-tjenesterne/madplan",
    questions: [{ label: "Allergier eller præferencer?" }],
    sampleTestimonials: [
      {
        authorName: "Martin",
        emoji: "🥕",
        text: "Syv dage, syv retter, nul gange \"hvad skal vi have at spise?\". Mit forhold er reddet.",
      },
    ],
  },
  {
    slug: "kiva",
    name: "Investér med Kiva",
    tagline: "Jeg gør verden bedre for dig",
    headline: "Jeg investerer i globale startups for dig",
    summary: "Du giver mig 25 dollars, og jeg låner dem ud til iværksættere i hele verden.",
    description:
      "Du giver mig 25 dollars, og jeg låner dem ud via Kiva til folk, der forsøger at starte en forretning rundt om i verden. Du gør verden til et bedre sted – og bliver en del af Kiva-gruppen.",
    emoji: "🌱",
    color: "#2a9d8f",
    category: "gode-gerninger",
    price: 12000,
    legacyPath: "/start/om-tjenesterne/investér-med-kiva",
    sampleTestimonials: [
      {
        authorName: "Bo",
        emoji: "🌍",
        text: "Mine 25 dollars hjalp en syerske i Peru med at købe en ny symaskine. Jeg fik et billede. Jeg græd lidt.",
      },
    ],
  },
  {
    slug: "jeg-hepper-paa-dig",
    name: "Jeg hepper på dig",
    tagline: "Jeg står ved målstregen",
    headline: "Jeg hepper på dig med et hjemmelavet skilt",
    summary: "Til dit løb, din eksamen, din koncert eller din første dag på jobbet.",
    description:
      "Du har trænet, øvet dig eller bare overlevet. Nu fortjener du en, der står og råber dit navn. Jeg laver et hjemmelavet skilt med glimmer og et ordspil, der er så dårligt, at du ikke kan lade være med at smile, og så står jeg ved målstregen, foran eksamenslokalet eller på første række.\n\nJeg hepper højt, jeg hepper ærligt, og jeg hepper også, når det går skidt. Især når det går skidt.",
    goodFor: ["Halvmaraton", "Eksamen", "Første dag på jobbet", "Koncert eller teaterpremiere", "Svære samtaler"],
    finePrint: "Jeg kan desværre ikke løbe med. Jeg kan gå lidt med.",
    emoji: "📣",
    color: "#ff9f1c",
    category: "jeg-dukker-op",
    price: 1470,
    legacyPath: "/start",
    questions: [
      { label: "Hvad skal jeg heppe på?", required: true },
      { label: "Hvor og hvornår?", kind: "datetime", required: true },
      { label: "Hvad skal der stå på skiltet? (eller skal jeg finde på noget)" },
    ],
    sampleTestimonials: [
      { authorName: "Sara", emoji: "🏃", text: "Skiltet sagde “Du er ikke langsom, du nyder bare udsigten”. Jeg grinede de sidste 2 km." },
    ],
  },
  {
    slug: "jeg-lytter",
    name: "Jeg lytter i 10 minutter",
    tagline: "Jeg lytter – uden et eneste råd",
    headline: "Jeg lytter i 10 minutter uden at give et eneste råd",
    summary: "Ingen løsninger. Ingen “har du prøvet …”. Bare ører.",
    description:
      "Nogle gange har man ikke brug for en løsning. Man har brug for, at nogen lytter. Jeg ringer til dig, eller vi ses, og så lytter jeg i 10 hele minutter. Jeg nikker, jeg siger “mm”, og jeg siger måske “det lyder hårdt”. Men jeg giver ikke et eneste råd.\n\nHvis jeg kommer til at give et råd, får du pengene tilbage.",
    finePrint: "Rådgivning kan tilkøbes separat under “Kærlighedsrådgivning”.",
    emoji: "👂",
    color: "#b8c0ff",
    category: "smaa-tanker",
    price: 1010,
    legacyPath: "/start",
    questions: [{ label: "Hvornår kan jeg ringe til dig?", kind: "datetime", required: true }],
    sampleTestimonials: [
      { authorName: "Johanne", emoji: "🫂", text: "Han sagde “mm” 23 gange og intet andet. Det var præcis det, jeg havde brug for." },
    ],
  },
  {
    slug: "hele-dit-navn",
    name: "Jeg lærer hele dit navn",
    tagline: "Jeg kender dig ved navn",
    headline: "Jeg lærer hele dit navn udenad – med mellemnavne",
    summary: "Og siger det højt, langsomt og med dyb respekt.",
    description:
      "De fleste kender kun dit fornavn. Måske dit efternavn. Men hvem kender dit andet mellemnavn? Det gør jeg snart. Jeg lærer hele dit fulde navn udenad, øver udtalen, og så sender jeg dig en video, hvor jeg siger det højt, langsomt og med den respekt, det fortjener.\n\nFremover kan du til enhver tid ringe og bede mig sige det.",
    emoji: "📛",
    color: "#ffd166",
    category: "smaa-tanker",
    price: 260,
    legacyPath: "/start",
    questions: [{ label: "Dit fulde navn (og hvordan det udtales)", required: true }],
    sampleTestimonials: [
      { authorName: "Frederikke Augusta", emoji: "👑", text: "Ingen har nogensinde sagt “Augusta” med så meget værdighed. Jeg har set videoen 40 gange." },
    ],
  },
  {
    slug: "jeg-siger-nej",
    name: "Jeg siger nej for dig",
    tagline: "Jeg siger nej på dine vegne",
    headline: "Jeg siger nej til de invitationer, du ikke tør afslå",
    summary: "Høfligt, venligt og helt uden at du får dårlig samvittighed.",
    description:
      "Bryllup hos en kollegas fætter? Brætspilsaften hos naboen, der altid snyder? Et “hurtigt møde” fredag kl. 16? Jeg skriver eller ringer og siger nej på dine vegne. Venligt, varmt og så overbevisende, at de næsten takker dig for at blive væk.",
    finePrint: "Jeg siger ikke nej til din mor. Det må du selv gøre.",
    emoji: "🙅",
    color: "#ef476f",
    category: "praktisk-venskab",
    price: 330,
    legacyPath: "/start",
    questions: [
      { label: "Hvem skal jeg sige nej til, og til hvad?", kind: "textarea", required: true },
      { label: "Hvordan kontakter jeg dem?", required: true },
    ],
    sampleTestimonials: [
      { authorName: "Morten", emoji: "😮‍💨", text: "Han afslog en polterabend for mig så smukt, at de inviterede ham i stedet." },
    ],
  },
  {
    slug: "en-sky-efter-dig",
    name: "En sky opkaldt efter dig",
    tagline: "Jeg navngiver en sky efter dig",
    headline: "Jeg navngiver en sky efter dig – før den forsvinder",
    summary: "Et foto, et navn, et øjebliks evighed.",
    description:
      "Stjerner kan man købe navne til, men de er langt væk og svære at se. En sky er lige her. Jeg finder den smukkeste sky, jeg kan se, giver den dit navn, fotograferer den og skriver en lille fødselsattest med tidspunkt, sted og form.\n\nSå forsvinder den. Men den var din.",
    delivery: "Fødselsattest og foto leveres digitalt – og skyen kommer på himmelglobussen.",
    emoji: "☁️",
    color: "#9bf6ff",
    category: "smaa-tanker",
    price: 160,
    legacyPath: "/start",
    questions: [{ label: "Hvad skal skyen hedde?", required: true }],
    sampleTestimonials: [
      { authorName: "Ida", emoji: "🌥️", text: "Skyen “Ida den Fluffy” levede i 11 minutter over Aarhus Ø. Jeg har attesten i ramme." },
    ],
  },
  {
    slug: "jeg-vaekker-dig",
    name: "Jeg vækker dig",
    tagline: "Jeg ringer og vækker dig",
    headline: "Jeg ringer og vækker dig med en sang, en joke eller en peptalk",
    summary: "Den blideste – eller mest entusiastiske – vækning du nogensinde har fået.",
    description:
      "Glem det skrattende vækkeur. Jeg ringer på det tidspunkt, du vælger, og vækker dig med enten en sang, en vittighed eller en motiverende tale, der får dig til at tro, at du kan alt. Jeg bliver ved, indtil jeg hører, at du er vågen.",
    emoji: "⏰",
    color: "#ffca3a",
    category: "praktisk-venskab",
    price: 450,
    legacyPath: "/start",
    variants: [{ name: "Med en sang" }, { name: "Med en vittighed" }, { name: "Med en motiverende tale" }],
    questions: [
      { label: "Hvornår skal jeg vække dig?", kind: "datetime", required: true },
      { label: "Telefonnummer", required: true },
    ],
    sampleTestimonials: [
      { authorName: "Jakob", emoji: "🥱", text: "Kl. 06.15 sang han en sang om min tandbørste. Jeg er aldrig kommet så hurtigt ud af sengen." },
    ],
  },
  {
    slug: "jeg-spiser-din-mad",
    name: "Jeg spiser din mislykkede mad",
    tagline: "Jeg roser din mad",
    headline: "Jeg spiser din mislykkede mad – og roser den",
    summary: "Brændt, saltet eller bare mærkelig. Jeg spiser det hele med et smil.",
    description:
      "Du har prøvet en ny opskrift, og den gik ikke helt som planlagt. Måske er den sort i bunden. Måske smager den af noget, ingen kan sætte ord på. Inviter mig, så spiser jeg det hele, og jeg finder noget oprigtigt pænt at sige om hver eneste bid.",
    finePrint: "Jeg spiser ikke svampe, du selv har plukket.",
    emoji: "🍲",
    color: "#f9844a",
    category: "jeg-dukker-op",
    price: 870,
    legacyPath: "/start",
    questions: [
      { label: "Hvad har du lavet?", required: true },
      { label: "Hvor og hvornår?", kind: "datetime", required: true },
    ],
    sampleTestimonials: [
      { authorName: "Rikke", emoji: "🔥", text: "Han kaldte min brændte lasagne “karamelliseret med selvtillid”. Jeg laver den igen." },
    ],
  },
  {
    slug: "papfigur-paa-ferie",
    name: "Jeg tager med på ferie (som papfigur)",
    tagline: "Jeg tager med på din ferie",
    headline: "Jeg tager med på din ferie – som papfigur i naturlig størrelse",
    summary: "Jeg er med på alle billederne, men fylder ikke i bilen.",
    description:
      "Du savner mig på ferien. Det forstår jeg godt. Derfor sender jeg en papfigur af mig selv i naturlig størrelse, som du kan tage med på stranden, i bjergene eller på all inclusive. Jeg brokker mig aldrig over vejret, og jeg er altid klar til et billede.\n\nSend mig billederne bagefter, så kommer de på væggen.",
    finePrint: "Papfiguren tåler ikke regn. Det gør jeg heller ikke rigtig.",
    emoji: "🧳",
    color: "#4cc9f0",
    category: "jeg-dukker-op",
    price: 3330,
    legacyPath: "/start",
    questions: [
      { label: "Leveringsadresse", kind: "textarea", required: true },
      { label: "Hvornår tager du afsted?", kind: "date", required: true },
    ],
    sampleTestimonials: [
      { authorName: "Familien Holm", emoji: "🏖️", text: "Papfigur-Villads var med på alle 214 feriebilleder. Han var bedre selskab end onkel Bent." },
    ],
  },
  {
    slug: "venskabsabonnement",
    name: "Venskabsabonnement",
    tagline: "Jeg er din ven hver måned",
    headline: "Et fast venskab – leveret hver måned",
    summary: "Et digt, en tanke og et stykke himmel. Hver eneste måned.",
    description:
      "Det bedste venskab er det, der bare bliver ved. Med et venskabsabonnement får du hver måned en lille pakke: et dedikeret digt, et minut hvor jeg tænker på dig og et nyt stykke himmel med geolokation. Ingen bindingsperiode – du stopper bare, når du har fået nok af mig (det sker ikke).",
    goodFor: ["Dig selv", "En ven der bor langt væk", "En der har brug for lidt ekstra"],
    finePrint: "Betales måned for måned via MobilePay. Opsig når som helst.",
    emoji: "💌",
    color: "#ff70a6",
    category: "ord-fra-hjertet",
    price: 7770,
    recurringLabel: "pr. måned",
    featured: true,
    legacyPath: "/start",
    sampleTestimonials: [
      { authorName: "Annette", emoji: "📬", text: "Den første i hver måned glæder jeg mig som et barn. I september fik jeg en sky over Skagen." },
    ],
  },
];

export const seedSettings: Record<string, string> = {
  mobilepayNumber: "60614309",
  mobilepayName: "Villads Claes",
  contactPhone: "60614309",
  contactEmail: "villadsclaes@gmail.com",
  introVideo: "b2Wab89xhOc",
};
