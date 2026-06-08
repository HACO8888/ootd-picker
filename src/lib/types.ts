// Shared domain types for the OOTD & Makeup Picker.

export type Category = "tops" | "bottoms" | "outerwear" | "accessories";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type Weather = "sunny" | "cloudy" | "rainy" | "cold";
export type Gender = "female" | "male" | "unisex";

/** A wardrobe garment. */
export interface Item {
  id: string;
  brand: string;
  name: string;
  category: Category;
  seasons: Season[];
  colors: string[];
  tags: string[];
  imageUrl: string;
}

/** A curated makeup look. */
export interface Makeup {
  id: string;
  name: string;
  gender: Gender[];
  tags: string[];
  weather: Weather[];
  focus: string;
  eye: string;
  lip: string;
  blush: string;
  highlight: string;
  colors: string[];
  makeupImageUrl: string;
}

/** A curated perfume. */
export interface Perfume {
  id: string;
  name: string;
  gender: Gender[];
  tags: string[];
  weather: Weather[];
  topNote: string;
  heartNote: string;
  baseNote: string;
  style: string;
  intensity: string;
  perfumeImageUrl: string;
}

/** The inputs collected by the wizard. */
export interface OOTDContext {
  weather: Weather;
  mood: string;
  destination: string;
  gender: Gender;
}

/** A complete recommendation produced by generateOOTD. */
export interface Outfit {
  top: Item | null;
  bottom: Item | null;
  outerwear: Item | null;
  accessory: Item | null;
  makeup: Makeup;
  perfume: Perfume;
  context: OOTDContext;
}

/** A saved favorite combination. */
export interface Favorite {
  id: string;
  date: string;
  /** Optional user-given name for the combination. */
  name?: string;
  outfit: Outfit;
}
