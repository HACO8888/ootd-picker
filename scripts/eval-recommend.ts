/**
 * Offline evaluation of the recommendation engine across every wizard context
 * (4 weather × 5 mood × 5 destination × 3 gender = 300) with several
 * "重新生成" runs each. Prints quality / diversity / speed metrics so algorithm
 * and data changes can be compared objectively.
 *
 *   pnpm eval:recommend                  # 5 regenerations per context
 *   pnpm eval:recommend --runs 10 --json scripts/.cache/eval.json
 *   pnpm eval:recommend --engine <recommend.ts> --catalog <catalog.json> --old-lookbook
 *   pnpm eval:recommend --small          # curated 17-piece closet + tagless uploads
 *
 * `--engine` / `--catalog` let an old engine or old data be measured with the
 * exact same harness (A/B). Ground-truth garment gender comes from the dataset
 * labels (scripts/.cache/styles.csv via fetch-fashion), not from the item, so a
 * catalog that predates the `gender` field is still measured fairly.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import "../src/lib/catalog-source";
import { getCatalog } from "../src/lib/catalog";
import { buildCloset, MAKEUP_LOOKBOOK, PERFUME_LOOKBOOK, setMakeupLookbook, setPerfumeLookbook } from "../src/lib/data";
import type { Gender, Item, OOTDSet, Outfit, Weather } from "../src/lib/types";

type Engine = {
  generateOOTDSet: (
    closet: Item[],
    weather: Weather,
    mood: string,
    destination: string,
    gender?: Gender,
    count?: number,
  ) => OOTDSet;
  seasonsForWeather: (w: Weather) => string[];
};

const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(k);
  return i > -1 ? process.argv[i + 1] : d;
};
const RUNS = parseInt(arg("--runs", "5"), 10);
const JSON_OUT = arg("--json", "");
const ENGINE = arg("--engine", "src/lib/recommend.ts");
const CATALOG = arg("--catalog", "");
const OLD_LOOKBOOK = process.argv.includes("--old-lookbook");
const SMALL = process.argv.includes("--small");

const WEATHERS: Weather[] = ["sunny", "cloudy", "rainy", "cold"];
const MOODS = ["活力", "放鬆", "專業", "優雅", "舒適"];
const DESTS = ["工作", "約會", "休閒漫步", "社交聚會", "居家"];
const GENDERS: Gender[] = ["female", "male", "unisex"];

const garments = (o: Outfit) => [o.top, o.bottom, o.outerwear, o.accessory].filter(Boolean) as Item[];

async function loadTruthGender(): Promise<Map<string, string>> {
  const m = new Map<string, string>();
  try {
    const csv = await readFile(path.resolve("scripts/.cache/styles.csv"), "utf8");
    const g: Record<string, string> = { Men: "male", Boys: "male", Women: "female", Girls: "female", Unisex: "unisex" };
    for (const line of csv.split("\n").slice(1)) {
      const [id, gender] = line.split(",");
      if (id) m.set(`fp_${id}`, g[gender] ?? "unisex");
    }
  } catch {
    console.warn("找不到 scripts/.cache/styles.csv（先跑 pnpm fetch:fashion），性別指標以 unisex 計");
  }
  return m;
}

/** Same shaping as getCatalog(), for measuring an arbitrary catalog JSON. */
async function loadCatalog(): Promise<Item[]> {
  if (SMALL) {
    // Curated defaults + uploads with no tags/gender — the sparse-closet edge case.
    const uploads: Item[] = [
      { id: "u1", brand: "自訂", name: "條紋上衣", category: "tops", seasons: ["spring"], colors: ["白色"], tags: [], imageUrl: "" },
      { id: "u2", brand: "自訂", name: "百褶裙", category: "bottoms", seasons: [], colors: ["黑色"], tags: [], imageUrl: "" },
      { id: "u3", brand: "自訂", name: "帆布托特包", category: "accessories", seasons: [], colors: ["米色"], tags: [], imageUrl: "" },
    ];
    return [...buildCloset(), ...uploads];
  }
  if (!CATALOG) return getCatalog();
  const raw = JSON.parse(await readFile(path.resolve(CATALOG), "utf8")) as Item[];
  const brands = ["UNIQLO", "NET", "GU"];
  return raw.map((it, idx) => ({ ...it, brand: brands[idx % brands.length] }));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const inter = [...a].filter((x) => b.has(x)).length;
  const uni = new Set([...a, ...b]).size;
  return uni ? inter / uni : 1;
}

async function main() {
  const { generateOOTDSet, seasonsForWeather } = (await import(pathToFileURL(path.resolve(ENGINE)).href)) as Engine;
  if (OLD_LOOKBOOK) {
    setMakeupLookbook(MAKEUP_LOOKBOOK.filter((m) => Number(m.id.slice(1)) <= 13));
    setPerfumeLookbook(PERFUME_LOOKBOOK.filter((p) => Number(p.id.slice(1)) <= 10));
  }
  const closet = await loadCatalog();
  const truth = await loadTruthGender();
  const genderOf = (i: Item) => truth.get(i.id) ?? i.gender ?? "unisex";

  const cnt = {
    outfits: 0,
    garments: 0,
    // hard violations (per outfit)
    maleGotWomens: 0,
    coldRainNoOuter: 0,
    sunnyWithOuter: 0,
    coldLightPiece: 0,
    workCasualBottom: 0,
    dressyUtilityBag: 0,
    // soft signals (per garment)
    femaleGotMens: 0,
    destDirect: 0,
    moodDirect: 0,
    seasonMatch: 0,
    harmonySum: 0,
    clash: 0,
    hasAccessory: 0,
    missingCore: 0,
    shortSets: 0,
  };
  const anyViolation = { n: 0 };
  const recommended = new Set<string>();
  const makeups = new Set<string>();
  const perfumes = new Set<string>();
  const makeupGenderMiss = { n: 0 };
  let regenJaccardSum = 0;
  let regenPairs = 0;
  let ctxUniqueSum = 0;
  let ctxMakeupVarietySum = 0;
  let ctxCount = 0;
  const timings: number[] = [];
  const perDest: Record<string, { n: number; v: number; dest: number }> = {};

  for (const weather of WEATHERS)
    for (const mood of MOODS)
      for (const destination of DESTS)
        for (const gender of GENDERS) {
          const runs: Set<string>[] = [];
          const ctxItems = new Set<string>();
          const ctxMakeups = new Set<string>();
          for (let r = 0; r < RUNS; r++) {
            const t0 = performance.now();
            const set = generateOOTDSet(closet, weather, mood, destination, gender);
            timings.push(performance.now() - t0);
            if (set.outfits.length < 3) cnt.shortSets++;
            const runIds = new Set<string>();
            for (const o of set.outfits) {
              cnt.outfits++;
              const gs = garments(o);
              const d = (perDest[destination] ??= { n: 0, v: 0, dest: 0 });
              d.n++;
              let violated = false;
              const flag = (k: keyof typeof cnt, cond: boolean) => {
                if (cond) {
                  cnt[k]++;
                  violated = true;
                }
              };
              flag("maleGotWomens", gender === "male" && gs.some((i) => genderOf(i) === "female"));
              flag("coldRainNoOuter", (weather === "cold" || weather === "rainy") && !o.outerwear);
              flag("sunnyWithOuter", weather === "sunny" && Boolean(o.outerwear));
              flag("coldLightPiece", weather === "cold" && /短褲|七分褲|短袖|背心/.test(`${o.top?.name ?? ""} ${o.bottom?.name ?? ""}`));
              flag("workCasualBottom", destination === "工作" && /短褲|運動長褲|內搭褲/.test(o.bottom?.name ?? ""));
              flag("dressyUtilityBag", (destination === "約會" || destination === "社交聚會") && /後背包|電腦包|旅行袋/.test(o.accessory?.name ?? ""));
              if (!o.top || !o.bottom) cnt.missingCore++;
              if (o.accessory) cnt.hasAccessory++;
              if (violated) {
                anyViolation.n++;
                d.v++;
              }
              if (gs.some((i) => i.tags.includes(destination))) d.dest++;
              const ts: string[] = seasonsForWeather(weather);
              for (const i of gs) {
                cnt.garments++;
                recommended.add(i.id);
                ctxItems.add(i.id);
                runIds.add(i.id);
                if (gender === "female" && genderOf(i) === "male") cnt.femaleGotMens++;
                if (i.tags.includes(destination)) cnt.destDirect++;
                if (i.tags.includes(mood)) cnt.moodDirect++;
                if (i.seasons.some((s) => ts.includes(s))) cnt.seasonMatch++;
              }
              cnt.harmonySum += o.harmony?.score ?? 0;
              if (o.harmony?.verdict === "clash") cnt.clash++;
              makeups.add(o.makeup.id);
              perfumes.add(o.perfume.id);
              ctxMakeups.add(o.makeup.id);
              if (gender !== "unisex" && !o.makeup.gender.includes(gender)) makeupGenderMiss.n++;
            }
            runs.push(runIds);
          }
          for (let r = 1; r < runs.length; r++) {
            regenJaccardSum += jaccard(runs[r - 1], runs[r]);
            regenPairs++;
          }
          ctxUniqueSum += ctxItems.size;
          ctxMakeupVarietySum += ctxMakeups.size;
          ctxCount++;
        }

  const pct = (n: number, d: number) => `${((100 * n) / Math.max(1, d)).toFixed(1)}%`;
  timings.sort((a, b) => a - b);
  const p = (q: number) => timings[Math.floor(q * (timings.length - 1))].toFixed(1);
  const femaleGarments = cnt.garments / 3; // rough share — 1/3 of contexts are female

  const report = {
    engine: ENGINE,
    catalog: SMALL ? "small" : CATALOG || "current",
    catalogSize: closet.length,
    runsPerContext: RUNS,
    outfits: cnt.outfits,
    hardViolationRate: pct(anyViolation.n, cnt.outfits),
    violations: {
      maleGotWomens: pct(cnt.maleGotWomens, cnt.outfits / 3),
      coldRainNoOuter: pct(cnt.coldRainNoOuter, cnt.outfits / 2),
      sunnyWithOuter: pct(cnt.sunnyWithOuter, cnt.outfits / 4),
      coldLightPiece: pct(cnt.coldLightPiece, cnt.outfits / 4),
      workCasualBottom: pct(cnt.workCasualBottom, cnt.outfits / 5),
      dressyUtilityBag: pct(cnt.dressyUtilityBag, (cnt.outfits * 2) / 5),
    },
    femaleGotMensGarments: pct(cnt.femaleGotMens, femaleGarments),
    destinationTagMatch: pct(cnt.destDirect, cnt.garments),
    moodTagMatch: pct(cnt.moodDirect, cnt.garments),
    seasonMatch: pct(cnt.seasonMatch, cnt.garments),
    harmonyAvg: (cnt.harmonySum / cnt.outfits).toFixed(1),
    clashRate: pct(cnt.clash, cnt.outfits),
    accessoryRate: pct(cnt.hasAccessory, cnt.outfits),
    missingCore: cnt.missingCore,
    setsShortOf3: cnt.shortSets,
    regenOverlapJaccard: (regenJaccardSum / Math.max(1, regenPairs)).toFixed(3),
    uniqueItemsPerContext: (ctxUniqueSum / ctxCount).toFixed(1),
    catalogCoverage: pct(recommended.size, closet.length),
    distinctMakeups: makeups.size,
    distinctPerfumes: perfumes.size,
    makeupVarietyPerContext: (ctxMakeupVarietySum / ctxCount).toFixed(2),
    makeupGenderMismatch: makeupGenderMiss.n,
    perDestination: Object.fromEntries(
      Object.entries(perDest).map(([k, v]) => [k, { violation: pct(v.v, v.n), destTagInOutfit: pct(v.dest, v.n) }]),
    ),
    msPerGenerate: { p50: p(0.5), p95: p(0.95), max: p(1) },
  };
  console.log(JSON.stringify(report, null, 2));
  if (JSON_OUT) await writeFile(path.resolve(JSON_OUT), JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
