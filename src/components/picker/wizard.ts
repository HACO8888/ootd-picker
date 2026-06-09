// Wizard state machine for the picker (useReducer).
import type { Gender, Outfit, Weather, Favorite } from "@/lib/types";
import { buildReasons } from "@/lib/recommend";
import { evaluateHarmony } from "@/lib/color-harmony";

export type Step = 1 | 2 | 3 | 4 | "loading" | "results";

export interface WizardState {
  step: Step;
  gender: Gender | "";
  weather: Weather | "";
  mood: string;
  destination: string;
  /** The currently-shown outfit (always === candidates[activeIdx] when present). */
  rec: Outfit | null;
  /** Several distinct outfits for A/B comparison; null before generation. */
  candidates: Outfit[] | null;
  activeIdx: number;
  saved: boolean;
  loadingText: { primary: string; secondary: string };
  appliedFavId: string | null;
  detecting: boolean;
}

/** Backfill reasons/harmony for an outfit that lacks them (e.g. an old favorite). */
function enrich(o: Outfit): Outfit {
  if (o.reasons && o.harmony) return o;
  const harmony = o.harmony ?? evaluateHarmony(o);
  const withHarmony = { ...o, harmony };
  return { ...withHarmony, reasons: o.reasons ?? buildReasons(withHarmony) };
}

export const LOADING_INIT = {
  primary: "正在為您挑選今日穿搭組合...",
  secondary: "正在調配今日妝容與香氛...",
};

export const initialWizard: WizardState = {
  step: 1,
  gender: "",
  weather: "",
  mood: "",
  destination: "",
  rec: null,
  candidates: null,
  activeIdx: 0,
  saved: false,
  loadingText: LOADING_INIT,
  appliedFavId: null,
  detecting: false,
};

export type WizardAction =
  | { type: "selectGender"; value: Gender }
  | { type: "selectWeather"; value: Weather }
  | { type: "selectMood"; value: string }
  | { type: "startDestination"; value: string }
  | { type: "setLoadingText"; value: { primary: string; secondary: string } }
  | { type: "setResult"; rec: Outfit }
  | { type: "setResultSet"; outfits: Outfit[] }
  | { type: "selectCandidate"; idx: number }
  | { type: "setRec"; rec: Outfit }
  | { type: "markSaved" }
  | { type: "reset" }
  | { type: "applyFavorite"; fav: Favorite }
  | { type: "setDetecting"; value: boolean }
  | { type: "setStep"; value: Step };

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "selectGender":
      return { ...state, gender: action.value, step: 2 };
    case "selectWeather":
      return { ...state, weather: action.value, step: 3 };
    case "selectMood":
      return { ...state, mood: action.value, step: 4 };
    case "startDestination":
      return { ...state, destination: action.value, step: "loading" };
    case "setLoadingText":
      return { ...state, loadingText: action.value };
    case "setResult":
      return { ...state, rec: action.rec, candidates: [action.rec], activeIdx: 0, saved: false, step: "results" };
    case "setResultSet": {
      const outfits = action.outfits.length ? action.outfits : state.candidates ?? [];
      return { ...state, candidates: outfits, activeIdx: 0, rec: outfits[0] ?? null, saved: false, step: "results" };
    }
    case "selectCandidate": {
      const list = state.candidates ?? [];
      const idx = Math.max(0, Math.min(action.idx, list.length - 1));
      return { ...state, activeIdx: idx, rec: list[idx] ?? state.rec, saved: false };
    }
    case "setRec": {
      const list = state.candidates ? [...state.candidates] : [action.rec];
      if (state.candidates) list[state.activeIdx] = action.rec;
      return { ...state, rec: action.rec, candidates: list };
    }
    case "markSaved":
      return { ...state, saved: true };
    case "reset":
      return { ...initialWizard };
    case "applyFavorite": {
      const o = enrich(action.fav.outfit);
      return {
        ...state,
        appliedFavId: action.fav.id,
        gender: o.context.gender || "unisex",
        weather: o.context.weather,
        mood: o.context.mood,
        destination: o.context.destination,
        rec: o,
        candidates: [o],
        activeIdx: 0,
        saved: true,
        step: "results",
      };
    }
    case "setDetecting":
      return { ...state, detecting: action.value };
    case "setStep":
      return { ...state, step: action.value };
  }
}
