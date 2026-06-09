// Wizard state machine for the picker (useReducer).
import type { Gender, Outfit, Weather, Favorite } from "@/lib/types";

export type Step = 1 | 2 | 3 | 4 | "loading" | "results";

export interface WizardState {
  step: Step;
  gender: Gender | "";
  weather: Weather | "";
  mood: string;
  destination: string;
  rec: Outfit | null;
  saved: boolean;
  loadingText: { primary: string; secondary: string };
  appliedFavId: string | null;
  detecting: boolean;
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
      return { ...state, rec: action.rec, saved: false, step: "results" };
    case "setRec":
      return { ...state, rec: action.rec };
    case "markSaved":
      return { ...state, saved: true };
    case "reset":
      return { ...initialWizard };
    case "applyFavorite": {
      const o = action.fav.outfit;
      return {
        ...state,
        appliedFavId: action.fav.id,
        gender: o.context.gender || "unisex",
        weather: o.context.weather,
        mood: o.context.mood,
        destination: o.context.destination,
        rec: o,
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
