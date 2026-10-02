export type CartLine = {
  /** Unik nøgle for linjen (produkt + variant + evt. eget beløb) */
  key: string;
  productId: number;
  slug: string;
  name: string;
  emoji: string;
  color: string;
  image?: string;
  variantId?: number;
  variantName?: string;
  /** Kun for produkter hvor kunden selv vælger beløbet */
  customPrice?: number;
  /** Visningspris – serveren genberegner altid den rigtige pris */
  unitPrice: number;
  quantity: number;
  unitLabel?: string;
};
