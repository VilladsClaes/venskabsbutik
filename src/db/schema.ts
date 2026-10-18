import { relations, sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import type { GeoJsonObject } from "geojson";

// Alle beløb gemmes som heltal i øre (540 = 5,40 kr) for at undgå afrundingsfejl.

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
};

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull().default("😊"),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const PRICE_KINDS = ["fixed", "per_unit", "custom"] as const;
export type PriceKind = (typeof PRICE_KINDS)[number];

export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    /** Den korte "Jeg ..."-sætning fra forsiden, fx "Jeg tænker på dig" */
    tagline: text("tagline").notNull(),
    /** Overskrift på produktsiden, fx "Jeg vil tænke på dig i et minut" */
    headline: text("headline").notNull(),
    summary: text("summary").notNull().default(""),
    description: text("description").notNull().default(""),
    /** JSON-liste: "Dette produkt er godt til ..." */
    goodFor: text("good_for", { mode: "json" }).$type<string[]>().notNull().default([]),
    finePrint: text("fine_print").notNull().default(""),
    delivery: text("delivery").notNull().default(""),
    emoji: text("emoji").notNull().default("😊"),
    color: text("color").notNull().default("#ffd23f"),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    /**
     * fixed: fast pris (kan overstyres af varianter)
     * per_unit: pris pr. enhed (fx pr. m²) – kunden vælger antal
     * custom: kunden vælger selv beløbet, men det skal ende på `priceEndsWith` øre
     */
    priceKind: text("price_kind", { enum: PRICE_KINDS }).notNull().default("fixed"),
    price: integer("price").notNull(),
    unitLabel: text("unit_label"),
    priceEndsWith: integer("price_ends_with"),
    minPrice: integer("min_price"),
    /** Gentagende ydelse, fx "pr. måned" */
    recurringLabel: text("recurring_label"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    legacyUrl: text("legacy_url"),
    ...timestamps,
  },
  (t) => [index("products_category_idx").on(t.categoryId)],
);

export const productVariants = sqliteTable("product_variants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  /** null = samme pris som produktet */
  price: integer("price"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const MEDIA_KINDS = ["image", "youtube", "video", "audio"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export const productMedia = sqliteTable("product_media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  kind: text("kind", { enum: MEDIA_KINDS }).notNull().default("image"),
  /** Billede/video-sti (/images/...) eller YouTube-id */
  url: text("url").notNull(),
  alt: text("alt").notNull().default(""),
  caption: text("caption").notNull().default(""),
  /** Eksempel fra en tidligere køber */
  isExample: integer("is_example", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const QUESTION_KINDS = ["text", "textarea", "date", "datetime"] as const;
export type QuestionKind = (typeof QUESTION_KINDS)[number];

/** Spørgsmål kunden skal besvare ved bestilling (erstatter de gamle Google Forms) */
export const productQuestions = sqliteTable("product_questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  kind: text("kind", { enum: QUESTION_KINDS }).notNull().default("text"),
  required: integer("required", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const CUSTOMER_ORIGINS = ["butik", "arkiv"] as const;
export type CustomerOrigin = (typeof CUSTOMER_ORIGINS)[number];

export const RELATION_KINDS = [
  "familie",
  "barndom",
  "skole",
  "gymnasium",
  "studie",
  "kaerlighed",
  "arbejde",
  "nabo",
  "fritid",
  "rejse",
  "tilfaeldig",
  "andet",
] as const;
export type RelationKind = (typeof RELATION_KINDS)[number];

export const customers = sqliteTable(
  "customers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    /** Fornavn eller dæknavn hvis Villads skriver om købet */
    nickname: text("nickname"),
    allowMention: integer("allow_mention", { mode: "boolean" }).notNull().default(true),
    notes: text("notes").notNull().default(""),
    /** "butik" = kom ind via et køb, "arkiv" = oprettet i venne-arkivet */
    origin: text("origin", { enum: CUSTOMER_ORIGINS }).notNull().default("butik"),
    relation: text("relation", { enum: RELATION_KINDS }),
    birthYear: integer("birth_year"),
    howWeMet: text("how_we_met").notNull().default(""),
    /** Hvad Villads ved om personen */
    aboutThem: text("about_them").notNull().default(""),
    /** Hvad vi har sammen: steder, jokes, fælles venner */
    together: text("together").notNull().default(""),
    /** Opdigtet testperson – kan fjernes samlet */
    isSample: integer("is_sample", { mode: "boolean" }).notNull().default(false),
    /** Hemmelig nøgle til personens indsigtsside (GDPR art. 15). Tom = intet aktivt link */
    insightToken: text("insight_token"),
    insightCreatedAt: integer("insight_created_at", { mode: "timestamp" }),
    insightViewedAt: integer("insight_viewed_at", { mode: "timestamp" }),
    ...timestamps,
  },
  (t) => [
    index("customers_email_idx").on(t.email),
    index("customers_phone_idx").on(t.phone),
    index("customers_origin_idx").on(t.origin),
    uniqueIndex("customers_insight_token_idx").on(t.insightToken),
  ],
);

/** Perioder i Villads' liv hvor personen var "aktiv" – angivet i Villads' alder */
export const friendPeriods = sqliteTable(
  "friend_periods",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    fromAge: real("from_age").notNull(),
    /** Tom = stadig aktiv */
    toAge: real("to_age"),
    /** 1 (sporadisk) til 5 (hver dag) */
    intensity: integer("intensity").notNull().default(3),
    label: text("label").notNull().default(""),
    ...timestamps,
  },
  (t) => [index("friend_periods_customer_idx").on(t.customerId)],
);

export const INTERACTION_KINDS = [
  "samtale",
  "opkald",
  "beskeder",
  "brev",
  "maaltid",
  "fest",
  "rejse",
  "oplevelse",
  "hjaelp",
  "svaer_tid",
  "kaerlighed",
  "konflikt",
  "gensyn",
  "milepael",
  "andet",
] as const;
export type InteractionKind = (typeof INTERACTION_KINDS)[number];

export const INTERACTION_SOURCES = [
  "hukommelse",
  "dagbog",
  "sms",
  "opkald",
  "email",
  "kalender",
  "sociale_medier",
  "foto",
] as const;
export type InteractionSource = (typeof INTERACTION_SOURCES)[number];

export const interactions = sqliteTable(
  "interactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    /** "2004", "2004-06" eller "2004-06-21" – erindringer er ofte upræcise */
    date: text("date").notNull(),
    kind: text("kind", { enum: INTERACTION_KINDS }).notNull().default("samtale"),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    source: text("source", { enum: INTERACTION_SOURCES }).notNull().default("hukommelse"),
    ...timestamps,
  },
  (t) => [index("interactions_customer_idx").on(t.customerId, t.date)],
);

/** "Årets gang" – Villads' fælles brev for et år, som alle årets venner får med i deres venskab-wrapped */
export const yearLetters = sqliteTable("year_letters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  year: integer("year").notNull().unique(),
  title: text("title").notNull().default(""),
  body: text("body").notNull().default(""),
  /** Først når året er "udgivet", kan vennerne se det */
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

/** En personlig hilsen til én person i årets brev */
export const yearNotes = sqliteTable(
  "year_notes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    body: text("body").notNull().default(""),
    ...timestamps,
  },
  (t) => [uniqueIndex("year_notes_customer_year_idx").on(t.customerId, t.year)],
);

export const ORDER_STATUSES = [
  "afventer_betaling",
  "betalt",
  "i_gang",
  "leveret",
  "annulleret",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["mobilepay", "bank", "paypal", "stripe", "crypto", "venskab"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type PaymentDetails = {
  barterOffer?: string;
  crypto?: { coin: string; network: string; address: string; amount: string; rateDkk: number; quotedAt: string };
};

export const orders = sqliteTable(
  "orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** Vises for kunden og skrives i MobilePay-beskeden, fx "VC-1042" */
    orderNumber: text("order_number").notNull().unique(),
    /** Hemmelig nøgle så kun kunden kan se sin ordreside */
    accessToken: text("access_token").notNull(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id),
    status: text("status", { enum: ORDER_STATUSES }).notNull().default("afventer_betaling"),
    paymentMethod: text("payment_method", { enum: PAYMENT_METHODS }).notNull().default("mobilepay"),
    /** Fx byttetilbud ved "Betal med venskab" eller kryptokurs på bestillingstidspunktet */
    paymentDetails: text("payment_details", { mode: "json" }).$type<PaymentDetails>(),
    stripeSessionId: text("stripe_session_id"),
    total: integer("total").notNull(),
    customerNote: text("customer_note").notNull().default(""),
    /** Gavetilstand: købt til en anden */
    isGift: integer("is_gift", { mode: "boolean" }).notNull().default(false),
    giftRecipient: text("gift_recipient"),
    giftMessage: text("gift_message"),
    /** Hemmelig nøgle til modtagerens gaveside (uden priser) */
    giftToken: text("gift_token"),
    adminNote: text("admin_note").notNull().default(""),
    paidAt: integer("paid_at", { mode: "timestamp" }),
    deliveredAt: integer("delivered_at", { mode: "timestamp" }),
    ...timestamps,
  },
  (t) => [index("orders_status_idx").on(t.status), index("orders_customer_idx").on(t.customerId)],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: integer("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    // Snapshot af navn og pris på købstidspunktet, så historikken holder selv om produktet ændres
    productName: text("product_name").notNull(),
    variantName: text("variant_name"),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull().default(1),
    lineTotal: integer("line_total").notNull(),
    /** Gratis bonus, fx fra "Dagens venskab" */
    isBonus: integer("is_bonus", { mode: "boolean" }).notNull().default(false),
    /** Billet til et event i kalenderen */
    eventId: integer("event_id").references(() => events.id, { onDelete: "set null" }),
    answers: text("answers", { mode: "json" })
      .$type<{ question: string; answer: string }[]>()
      .notNull()
      .default([]),
  },
  (t) => [index("order_items_order_idx").on(t.orderId), index("order_items_product_idx").on(t.productId)],
);

/** Registrerede indbetalinger. Gør det muligt senere at tilføje flere betalingsmetoder. */
export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  method: text("method", { enum: PAYMENT_METHODS }).notNull().default("mobilepay"),
  amount: integer("amount").notNull(),
  reference: text("reference").notNull().default(""),
  note: text("note").notNull().default(""),
  receivedAt: integer("received_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/** Villads' egen tjekliste til en ordre – hvad er gjort, og hvad mangler */
export const orderTasks = sqliteTable(
  "order_tasks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    done: integer("done", { mode: "boolean" }).notNull().default(false),
    doneAt: integer("done_at", { mode: "timestamp" }),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("order_tasks_order_idx").on(t.orderId)],
);

/** Forarbejde til en ordre: udkast (fx jokes), datoer, steder og billeder – kun for admin */
export const orderDrafts = sqliteTable(
  "order_drafts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    title: text("title").notNull().default(""),
    body: text("body").notNull().default(""),
    imageUrl: text("image_url"),
    ...timestamps,
  },
  (t) => [index("order_drafts_order_idx").on(t.orderId)],
);

/**
 * Leveringsdagbogen: hvad Villads faktisk har leveret, og hvor.
 * Driver bænkekortet, himmelglobussen, tankemåleren, lussing-hitlisten, væggen m.fl.
 */
export const deliveries = sqliteTable(
  "deliveries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    note: text("note").notNull().default(""),
    /** Hvem det var til – vises kun hvis køberen har sagt ja til at blive nævnt */
    dedicatedTo: text("dedicated_to"),
    placeName: text("place_name"),
    lat: real("lat"),
    lng: real("lng"),
    photoUrl: text("photo_url"),
    /** Fx minutter tænkt, rødme 1-10, beløb i øre – afhænger af produktet */
    amount: real("amount"),
    deliveredAt: integer("delivered_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
    ...timestamps,
  },
  (t) => [index("deliveries_product_idx").on(t.productId)],
);

export const TESTIMONIAL_STATUSES = ["pending", "published", "hidden"] as const;
export type TestimonialStatus = (typeof TESTIMONIAL_STATUSES)[number];

export const testimonials = sqliteTable(
  "testimonials",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    rating: integer("rating").notNull().default(5),
    text: text("text").notNull(),
    emoji: text("emoji").notNull().default("😊"),
    status: text("status", { enum: TESTIMONIAL_STATUSES }).notNull().default("pending"),
    /** Eksempeltekst fra opsætningen – skal erstattes af rigtige anmeldelser */
    isSample: integer("is_sample", { mode: "boolean" }).notNull().default(false),
    ...timestamps,
  },
  (t) => [index("testimonials_product_idx").on(t.productId)],
);

export const CALENDAR_PROVIDERS = ["google", "outlook"] as const;
export type CalendarProvider = (typeof CALENDAR_PROVIDERS)[number];

/** Villads' tilsluttede kalendere. Nøglerne gemmes krypteret (se lib/calendar/crypto.ts). */
export const calendarConnections = sqliteTable("calendar_connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  provider: text("provider", { enum: CALENDAR_PROVIDERS }).notNull().unique(),
  accountEmail: text("account_email").notNull().default(""),
  refreshToken: text("refresh_token").notNull(),
  accessToken: text("access_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  /** Google: "primary" eller et kalender-id. Outlook: tom = standardkalenderen */
  calendarId: text("calendar_id").notNull().default("primary"),
  lastError: text("last_error"),
  ...timestamps,
});

/** Events i kalenderen, som man kan købe sig adgang til (bow combat, gyserfilm, cykeltur …) */
export const events = sqliteTable(
  "events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    emoji: text("emoji").notNull().default("🎉"),
    color: text("color").notNull().default("#ffd23f"),
    summary: text("summary").notNull().default(""),
    description: text("description").notNull().default(""),
    location: text("location").notNull().default(""),
    startsAt: integer("starts_at", { mode: "timestamp" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp" }).notNull(),
    /** Pris pr. plads i øre. 0 = gratis */
    price: integer("price").notNull().default(0),
    /** Antal pladser. null = ubegrænset */
    capacity: integer("capacity"),
    /** Fx "foedselsdag" – eventet hører til et eksisterende produkt */
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    /** Rute til rutekortet (GeoJSON), fx en cykeltur gennem Danmark */
    routeGeojson: text("route_geojson", { mode: "json" }).$type<GeoJsonObject>(),
    published: integer("published", { mode: "boolean" }).notNull().default(true),
    /** Id på kalenderposten hos hver udbyder */
    externalIds: text("external_ids", { mode: "json" })
      .$type<Partial<Record<CalendarProvider, string>>>()
      .notNull()
      .default({}),
    syncError: text("sync_error"),
    ...timestamps,
  },
  (t) => [index("events_starts_idx").on(t.startsAt)],
);

export const SIGNUP_STATUSES = ["afventer", "bekraeftet", "annulleret"] as const;
export type SignupStatus = (typeof SIGNUP_STATUSES)[number];

/** Tilmeldinger til et event. Bekræftes når ordren er betalt – så tilføjes e-mailen til kalenderposten. */
export const eventSignups = sqliteTable(
  "event_signups",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    seats: integer("seats").notNull().default(1),
    status: text("status", { enum: SIGNUP_STATUSES }).notNull().default("afventer"),
    /** Hvornår deltageren sidst blev skrevet på kalenderposten */
    calendarSyncedAt: integer("calendar_synced_at", { mode: "timestamp" }),
    syncError: text("sync_error"),
    ...timestamps,
  },
  (t) => [index("event_signups_event_idx").on(t.eventId), index("event_signups_order_idx").on(t.orderId)],
);

export const settings = sqliteTable(
  "settings",
  {
    key: text("key").notNull(),
    value: text("value").notNull(),
  },
  (t) => [uniqueIndex("settings_key_idx").on(t.key)],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  variants: many(productVariants),
  media: many(productMedia),
  questions: many(productQuestions),
  testimonials: many(testimonials),
  deliveries: many(deliveries),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
}));

export const productMediaRelations = relations(productMedia, ({ one }) => ({
  product: one(products, { fields: [productMedia.productId], references: [products.id] }),
}));

export const productQuestionsRelations = relations(productQuestions, ({ one }) => ({
  product: one(products, { fields: [productQuestions.productId], references: [products.id] }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  periods: many(friendPeriods),
  interactions: many(interactions),
  yearNotes: many(yearNotes),
}));

export const yearNotesRelations = relations(yearNotes, ({ one }) => ({
  customer: one(customers, { fields: [yearNotes.customerId], references: [customers.id] }),
}));

export const friendPeriodsRelations = relations(friendPeriods, ({ one }) => ({
  customer: one(customers, { fields: [friendPeriods.customerId], references: [customers.id] }),
}));

export const interactionsRelations = relations(interactions, ({ one }) => ({
  customer: one(customers, { fields: [interactions.customerId], references: [customers.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems),
  payments: many(payments),
  tasks: many(orderTasks),
  drafts: many(orderDrafts),
  signups: many(eventSignups),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  product: one(products, { fields: [events.productId], references: [products.id] }),
  signups: many(eventSignups),
}));

export const eventSignupsRelations = relations(eventSignups, ({ one }) => ({
  event: one(events, { fields: [eventSignups.eventId], references: [events.id] }),
  order: one(orders, { fields: [eventSignups.orderId], references: [orders.id] }),
}));

export const orderTasksRelations = relations(orderTasks, ({ one }) => ({
  order: one(orders, { fields: [orderTasks.orderId], references: [orders.id] }),
}));

export const orderDraftsRelations = relations(orderDrafts, ({ one }) => ({
  order: one(orders, { fields: [orderDrafts.orderId], references: [orders.id] }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
  event: one(events, { fields: [orderItems.eventId], references: [events.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export const testimonialsRelations = relations(testimonials, ({ one }) => ({
  product: one(products, { fields: [testimonials.productId], references: [products.id] }),
  customer: one(customers, { fields: [testimonials.customerId], references: [customers.id] }),
}));

export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  product: one(products, { fields: [deliveries.productId], references: [products.id] }),
  order: one(orders, { fields: [deliveries.orderId], references: [orders.id] }),
}));
