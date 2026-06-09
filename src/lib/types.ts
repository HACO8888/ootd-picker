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

/** Why a particular outfit was recommended (shown in the results view). */
export interface Reason {
  kind: "weather" | "mood" | "destination" | "season" | "color" | "outerwear";
  slot?: "top" | "bottom" | "outerwear" | "accessory" | "makeup" | "perfume";
  /** A complete, ready-to-display Chinese sentence. */
  text: string;
}

export type HarmonyVerdict = "harmonious" | "clash" | "caution";

/** Colour-harmony assessment of an outfit's garment colours. */
export interface HarmonyResult {
  verdict: HarmonyVerdict;
  /** 0–100, higher is more harmonious. */
  score: number;
  /** Short Chinese label: 協調 / 需注意 / 撞色. */
  label: string;
  notes: string[];
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
  /** Optional — present on freshly generated outfits, absent on old saved ones. */
  reasons?: Reason[];
  harmony?: HarmonyResult;
}

/** Several distinct outfits generated for the same context (A/B comparison). */
export interface OOTDSet {
  outfits: Outfit[];
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

/** A record of an outfit actually worn on a given day. */
export interface WearLog {
  id: string;
  /** Local ISO date "YYYY-MM-DD" — the day the outfit was worn. */
  date: string;
  outfit: Outfit;
  /** Optional short note for the day. */
  note?: string;
  /** Source favorite id, if logged from a saved combination (reference only). */
  favoriteId?: string;
  createdAt: number;
}
