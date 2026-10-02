import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";

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

export const MEDIA_KINDS = ["image", "youtube", "video"] as const;
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
    ...timestamps,
  },
  (t) => [index("customers_email_idx").on(t.email), index("customers_phone_idx").on(t.phone)],
);

export const ORDER_STATUSES = [
  "afventer_betaling",
  "betalt",
  "i_gang",
  "leveret",
  "annulleret",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["mobilepay"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

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
    total: integer("total").notNull(),
    customerNote: text("customer_note").notNull().default(""),
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
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export const testimonialsRelations = relations(testimonials, ({ one }) => ({
  product: one(products, { fields: [testimonials.productId], references: [products.id] }),
  customer: one(customers, { fields: [testimonials.customerId], references: [customers.id] }),
}));
