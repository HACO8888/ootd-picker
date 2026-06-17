// Static catalog data — ported verbatim from the legacy app.js (v10).
// 17 curated items (UNIQLO 6 · NET 6 · GU 5), 13 makeup looks, 10 perfumes.
import type { Item, Makeup, Perfume, Category, Gender, Season } from "./types";

/* ═══════════════════════════════════════════════════════════════════════════
   LOCAL IMAGE PATHS — AI-generated, 100% matched to item descriptions
   ═══════════════════════════════════════════════════════════════════════════ */
export const IMG = {
  white_tshirt: "/images/white_tshirt.png",
  black_tshirt: "/images/black_tshirt.png",
  blue_hoodie: "/images/blue_hoodie.png",
  pink_sweater: "/images/pink_sweater.png",
  flannel_shirt: "/images/flannel_shirt.png",
  linen_blouse: "/images/linen_blouse.png",
  blue_jeans: "/images/blue_jeans.png",
  black_trousers: "/images/black_trousers.png",
  khaki_shorts: "/images/khaki_shorts.png",
  pleated_skirt: "/images/pleated_skirt.png",
  wide_pants: "/images/wide_pants.png",
  denim_jacket: "/images/denim_jacket.png",
  leather_jacket: "/images/leather_jacket.png",
  trench_coat: "/images/trench_coat.png",
  white_puffer: "/images/white_puffer.png",
  black_backpack: "/images/black_backpack.png",
  leather_handbag: "/images/leather_handbag.png",
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
   UNIQLO — 6 · NET — 6 · GU — 5
   ═══════════════════════════════════════════════════════════════════════════ */
const UNIQLO_ITEMS: Item[] = [
  { id: "uq01", brand: "UNIQLO", name: "白色棉質圓領短袖T恤", category: "tops", seasons: ["spring", "summer"], colors: ["白色"], tags: ["放鬆", "休閒漫步", "工作"], imageUrl: IMG.white_tshirt },
  { id: "uq02", brand: "UNIQLO", name: "紅格紋法蘭絨長袖襯衫", category: "tops", seasons: ["autumn", "winter"], colors: ["紅格紋"], tags: ["放鬆", "休閒漫步", "舒適"], imageUrl: IMG.flannel_shirt },
  { id: "uq03", brand: "UNIQLO", name: "經典藍色直筒牛仔褲", category: "bottoms", seasons: ["spring", "autumn", "winter"], colors: ["藍色"], tags: ["放鬆", "休閒漫步", "工作"], imageUrl: IMG.blue_jeans },
  { id: "uq04", brand: "UNIQLO", name: "卡其色棉質休閒短褲", category: "bottoms", seasons: ["summer"], colors: ["卡其色"], tags: ["放鬆", "休閒漫步", "活力"], imageUrl: IMG.khaki_shorts },
  { id: "uq05", brand: "UNIQLO", name: "淺藍色經典牛仔外套", category: "outerwear", seasons: ["spring", "autumn"], colors: ["淡藍色"], tags: ["活力", "休閒漫步"], imageUrl: IMG.denim_jacket },
  { id: "uq06", brand: "UNIQLO", name: "白色輕量羽絨短外套", category: "outerwear", seasons: ["winter"], colors: ["白色"], tags: ["舒適", "工作", "休閒漫步"], imageUrl: IMG.white_puffer },
];

const NET_ITEMS: Item[] = [
  { id: "net01", brand: "NET", name: "黑色純棉V領短袖T恤", category: "tops", seasons: ["spring", "summer"], colors: ["黑色"], tags: ["放鬆", "工作", "休閒漫步"], imageUrl: IMG.black_tshirt },
  { id: "net02", brand: "NET", name: "藍色連帽大學T", category: "tops", seasons: ["spring", "autumn"], colors: ["藍色"], tags: ["活力", "放鬆", "休閒漫步"], imageUrl: IMG.blue_hoodie },
  { id: "net03", brand: "NET", name: "米白色百褶中長裙", category: "bottoms", seasons: ["spring", "summer", "autumn"], colors: ["米白色"], tags: ["優雅", "約會", "休閒漫步"], imageUrl: IMG.pleated_skirt },
  { id: "net04", brand: "NET", name: "黑色修身西裝長褲", category: "bottoms", seasons: ["spring", "autumn", "winter"], colors: ["黑色"], tags: ["專業", "工作", "優雅"], imageUrl: IMG.black_trousers },
  { id: "net05", brand: "NET", name: "黑色皮革騎士外套", category: "outerwear", seasons: ["spring", "autumn"], colors: ["黑色"], tags: ["活力", "社交聚會", "約會"], imageUrl: IMG.leather_jacket },
  { id: "net06", brand: "NET", name: "黑色尼龍後背包", category: "accessories", seasons: ["spring", "summer", "autumn", "winter"], colors: ["黑色"], tags: ["工作", "活力", "休閒漫步"], imageUrl: IMG.black_backpack },
];

const GU_ITEMS: Item[] = [
  { id: "gu01", brand: "GU", name: "粉色V領針織毛衣", category: "tops", seasons: ["autumn", "winter"], colors: ["粉色"], tags: ["優雅", "約會", "舒適"], imageUrl: IMG.pink_sweater },
  { id: "gu02", brand: "GU", name: "米色亞麻短袖襯衫", category: "tops", seasons: ["spring", "summer"], colors: ["米色"], tags: ["優雅", "約會", "休閒漫步"], imageUrl: IMG.linen_blouse },
  { id: "gu03", brand: "GU", name: "米白色棉麻闊腿寬褲", category: "bottoms", seasons: ["spring", "summer"], colors: ["米白色"], tags: ["優雅", "約會", "放鬆"], imageUrl: IMG.wide_pants },
  { id: "gu04", brand: "GU", name: "卡其色長版雙排扣風衣", category: "outerwear", seasons: ["spring", "autumn"], colors: ["卡其色"], tags: ["優雅", "工作", "休閒漫步"], imageUrl: IMG.trench_coat },
  { id: "gu05", brand: "GU", name: "焦糖色皮革手提包", category: "accessories", seasons: ["spring", "summer", "autumn", "winter"], colors: ["焦糖色"], tags: ["優雅", "工作", "約會"], imageUrl: IMG.leather_handbag },
];

/** The default catalog used to seed a fresh closet. */
export function buildCloset(): Item[] {
  return [...UNIQLO_ITEMS, ...NET_ITEMS, ...GU_ITEMS];
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAKEUP LOOKBOOK — 13 looks
   ═══════════════════════════════════════════════════════════════════════════ */
// 可被管理員後台覆寫：客戶端載入 DB 版本後以 setMakeupLookbook 重新賦值。
// 因 ES module live binding，recommend.ts 內的引用會自動反映新值（seed 來源）。
export let MAKEUP_LOOKBOOK: Makeup[] = [
  { id: "m1", name: "日系清透白開水妝", gender: ["female", "unisex"], tags: ["放鬆", "舒適", "休閒漫步", "居家"], weather: ["sunny", "cloudy"], focus: "清透水潤底妝，強調無粉感與原生好膚質", eye: "啞光大地裸色，自然臥蠶，根根分明睫毛", lip: "蜜桃粉水光唇蜜", blush: "膨脹色淡櫻花粉腮紅", highlight: "玻璃光打亮", colors: ["#ffe3e3", "#ffd1d1", "#f5b5b5"], makeupImageUrl: "/looks/makeup-japanese-clear.jpg" },
  { id: "m2", name: "都會洗鍊知性妝", gender: ["female"], tags: ["專業", "工作"], weather: ["sunny", "cloudy", "rainy", "cold"], focus: "微霧面高級底妝，著重輪廓線條感", eye: "漸層消腫冷大地色，深棕色內眼線", lip: "啞光煙燻玫瑰色唇膏", blush: "收縮色肉桂茶色腮紅", highlight: "微啞光米色提亮", colors: ["#cfa89a", "#9c7769", "#63473f"], makeupImageUrl: "/looks/makeup-urban-intellectual.jpg" },
  { id: "m3", name: "微醺法式優雅妝", gender: ["female"], tags: ["優雅", "約會", "休閒漫步"], weather: ["cloudy", "cold", "rainy"], focus: "絲絨奶油底妝，微醺慵懶復古氛圍", eye: "楓葉橘棕暖調眼影，香檳金閃片", lip: "絲絨啞光焦糖栗子色", blush: "暖杏色大面積橫向掃面中", highlight: "暖香檳金高光", colors: ["#e3a07b", "#bd754e", "#944b25"], makeupImageUrl: "/looks/makeup-french-elegant.jpg" },
  { id: "m4", name: "派對焦點復古妝", gender: ["female"], tags: ["活力", "優雅", "約會"], weather: ["sunny", "cloudy", "cold", "rainy"], focus: "精緻遮瑕全霧面底妝，紅唇深邃眼妝", eye: "復古灰粉消腫色眼影，俐落貓眼眼線", lip: "霧面正紅色唇釉", blush: "低飽和度土色腮紅修容", highlight: "珍珠白高光", colors: ["#b83232", "#821a1a", "#541010"], makeupImageUrl: "/looks/makeup-party-retro.jpg" },
  { id: "m5", name: "元氣多汁西柚橘", gender: ["female"], tags: ["活力", "放鬆", "休閒漫步"], weather: ["sunny"], focus: "元氣水亮清透底妝，鮮明夏日活力", eye: "暖橘調蜜桃粉色，金黃偏光細閃", lip: "鏡面橘紅色西柚唇釉", blush: "活力西柚橘色腮紅", highlight: "蜜桃偏光打亮", colors: ["#fca872", "#fc8844", "#df5814"], makeupImageUrl: "/looks/makeup-grapefruit.jpg" },
  { id: "m6", name: "溫柔蜜桃妝", gender: ["female"], tags: ["放鬆", "優雅", "約會"], weather: ["sunny", "cloudy"], focus: "水嫩蜜桃清爽粉橘，鄰家女孩般溫柔", eye: "淺蜜桃色打底，暖香檳金提亮臥蠶", lip: "透亮珊瑚蜜桃色唇蜜", blush: "蜜桃粉色面中提亮", highlight: "粉金偏光高光", colors: ["#ffcbb4", "#ffb08f", "#e07a5f"], makeupImageUrl: "/looks/makeup-peach.jpg" },
  { id: "m7", name: "玫瑰乾枯花瓣妝", gender: ["female", "unisex"], tags: ["優雅", "約會", "社交聚會"], weather: ["cloudy", "cold"], focus: "霧面低飽和莫蘭迪玫瑰色，高冷浪漫", eye: "灰粉玫瑰色眼影，低調微光亮片", lip: "啞光乾枯玫瑰粉色唇膏", blush: "煙燻粉色斜打修容", highlight: "香檳粉高光", colors: ["#e2a4a4", "#b87373", "#8f4f4f"], makeupImageUrl: "/looks/makeup-rose.jpg" },
  { id: "m8", name: "落日橘子汽水妝", gender: ["female"], tags: ["活力", "放鬆", "休閒漫步"], weather: ["sunny"], focus: "熱情多汁橘黃暖色調", eye: "暖金橘色系漸層，大顆粒金橘亮片", lip: "亮面番茄橘紅色唇蜜", blush: "亮橘色斜掃眼下", highlight: "金偏光高光", colors: ["#fca34d", "#e07a5f", "#bf4324"], makeupImageUrl: "/looks/makeup-sunset-orange.jpg" },
  { id: "m9", name: "冷感高級水泥妝", gender: ["female", "unisex"], tags: ["專業", "工作", "社交聚會"], weather: ["cloudy", "rainy", "cold"], focus: "極簡高級冷灰色調，俐落個性", eye: "灰褐色打底，銀灰亮片，犀利黑色眼線", lip: "麥芽裸土色唇膏", blush: "啞光冷杏色修容", highlight: "銀白細亮光", colors: ["#dfd3c3", "#a69076", "#726a5c"], makeupImageUrl: "/looks/makeup-cement-cool.jpg" },
  { id: "m10", name: "慵懶奶茶燕麥妝", gender: ["female", "unisex"], tags: ["放鬆", "舒適", "居家", "休閒漫步"], weather: ["sunny", "cloudy", "cold"], focus: "溫暖柔和燕麥奶茶色，乾淨舒適", eye: "啞光燕麥色打底，淺駝色加深眼窩", lip: "溫柔焦糖奶茶色唇釉", blush: "烤奶茶色暈染腮紅", highlight: "微弱香檳色偏光", colors: ["#dec5a5", "#b39474", "#8a6e51"], makeupImageUrl: "/looks/makeup-milktea.jpg" },
  { id: "m11", name: "清爽男士理容", gender: ["male", "unisex"], tags: ["專業", "工作", "休閒漫步"], weather: ["sunny", "cloudy", "rainy", "cold"], focus: "控油啞光，隱形毛孔，強調乾淨俐落感", eye: "修整眉型，透明定型眉膠梳理毛流", lip: "無色潤澤護唇膏", blush: "無腮紅，保留原生膚色", highlight: "霧面局部蜜粉定妝", colors: ["#e6d5c3", "#d9c4ad", "#bd9d82"], makeupImageUrl: "/looks/makeup-mens-clean.jpg" },
  { id: "m12", name: "自然偽素顏提亮", gender: ["male", "unisex"], tags: ["約會", "優雅", "放鬆"], weather: ["sunny", "cloudy"], focus: "輕薄素顏霜均勻膚色，自然提亮氣色", eye: "自然野生眉，深棕色填補眉尾", lip: "淡色潤唇膏，改善氣色", blush: "極淡修容加深鼻影與輪廓", highlight: "微透自然肌膚光澤", colors: ["#f2d8c9", "#e6c2ad", "#c79a81"], makeupImageUrl: "/looks/makeup-natural-bare.jpg" },
  { id: "m13", name: "立體深邃骨相妝", gender: ["male", "unisex"], tags: ["社交聚會", "活力", "專業"], weather: ["cloudy", "cold", "rainy"], focus: "強化臉部折疊度，展現深邃立體五官", eye: "灰棕色加深眼窩，濃密毛流感劍眉", lip: "啞光霧面裸色護唇膏", blush: "灰棕色側臉及下顎線修容", highlight: "霧面高光提亮眉骨與鼻樑", colors: ["#d6c8b8", "#ab9884", "#786857"], makeupImageUrl: "/looks/makeup-deep-contour.jpg" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   PERFUME LOOKBOOK — 10 scents
   ═══════════════════════════════════════════════════════════════════════════ */
export let PERFUME_LOOKBOOK: Perfume[] = [
  { id: "p1", name: "白茶禪意清透香", gender: ["female", "male", "unisex"], tags: ["放鬆", "舒適", "居家", "休閒漫步"], weather: ["sunny", "cloudy"], topNote: "白茶、清檸、薄荷葉", heartNote: "茉莉、鈴蘭、白玫瑰", baseNote: "白麝香、雪松木、琥珀", style: "清透淡雅，若有似無的禪意", intensity: "淡香水 (EDT)", perfumeImageUrl: "/looks/perfume-white-tea.jpg" },
  { id: "p2", name: "玫瑰絲絨女人香", gender: ["female"], tags: ["優雅", "約會", "社交聚會"], weather: ["sunny", "cloudy", "cold"], topNote: "大馬士革玫瑰、荔枝、覆盆子", heartNote: "牡丹、紫羅蘭、桂花", baseNote: "麝香、廣藿香、檀香", style: "飽滿玫瑰花心，浪漫而成熟", intensity: "香水 (EDP)", perfumeImageUrl: "/looks/perfume-rose-velvet.jpg" },
  { id: "p3", name: "海洋深藍男士香", gender: ["male"], tags: ["活力", "工作", "休閒漫步"], weather: ["sunny", "cloudy"], topNote: "海洋元素、佛手柑、薄荷", heartNote: "紫羅蘭葉、鼠尾草、薰衣草", baseNote: "雪松、琥珀、廣藿香", style: "清新海洋調，展現男性自信", intensity: "淡香水 (EDT)", perfumeImageUrl: "/looks/perfume-ocean-blue.jpg" },
  { id: "p4", name: "東方琥珀神秘香", gender: ["female", "male", "unisex"], tags: ["優雅", "社交聚會", "約會"], weather: ["cold", "rainy", "cloudy"], topNote: "肉桂、番紅花、橙花", heartNote: "玫瑰、廣藿香、鳶尾根", baseNote: "琥珀、安息香、沉香", style: "神秘深邃的東方辛香", intensity: "香精 (Parfum)", perfumeImageUrl: "/looks/perfume-amber.jpg" },
  { id: "p5", name: "柑橘薄荷元氣香", gender: ["female", "male", "unisex"], tags: ["活力", "放鬆", "休閒漫步", "工作"], weather: ["sunny"], topNote: "西西里檸檬、葡萄柚、薄荷", heartNote: "佛手柑、橙花、羅勒", baseNote: "白麝香、龍涎香、雪松", style: "活潑爽朗的柑橘果香", intensity: "淡香水 (EDT)", perfumeImageUrl: "/looks/perfume-citrus-mint.jpg" },
  { id: "p6", name: "麝香絲絨慵懶香", gender: ["female", "unisex"], tags: ["放鬆", "舒適", "居家"], weather: ["cloudy", "cold", "rainy"], topNote: "梨子、白桃、洋梨", heartNote: "玫瑰木、麝香玫瑰、鳶尾", baseNote: "白麝香、香草、檀香木", style: "極度貼膚、慵懶而令人安心", intensity: "淡香精 (EDP)", perfumeImageUrl: "/looks/perfume-musk-velvet.jpg" },
  { id: "p7", name: "雪松皮革商務香", gender: ["male"], tags: ["專業", "工作", "優雅"], weather: ["cloudy", "rainy", "cold"], topNote: "佛手柑、黑胡椒、薑", heartNote: "藏紅花、天竺葵、玫瑰木", baseNote: "雪松、皮革、廣藿香", style: "乾燥俐落的木質皮革調", intensity: "淡香精 (EDP)", perfumeImageUrl: "/looks/perfume-cedar-leather.jpg" },
  { id: "p8", name: "蜜桃茉莉少女香", gender: ["female"], tags: ["放鬆", "優雅", "約會", "休閒漫步"], weather: ["sunny", "cloudy"], topNote: "白桃、覆盆子、荔枝", heartNote: "茉莉、玉蘭花、梔子花", baseNote: "香草、麝香、白檀", style: "清新而溫柔，充滿少女靈氣", intensity: "淡香水 (EDT)", perfumeImageUrl: "/looks/perfume-white-tea.jpg" },
  { id: "p9", name: "廣藿大地森林香", gender: ["male", "unisex"], tags: ["活力", "放鬆", "休閒漫步"], weather: ["rainy", "cold", "cloudy"], topNote: "尤加利、羅勒、薄荷", heartNote: "廣藿香、雪松、絲柏", baseNote: "苔蘚、橡木、龍涎香", style: "雨後森林的泥土芬芳", intensity: "淡香精 (EDP)", perfumeImageUrl: "/looks/perfume-ocean-blue.jpg" },
  { id: "p10", name: "薰衣草香草晚安香", gender: ["female", "male", "unisex"], tags: ["舒適", "居家", "放鬆"], weather: ["cloudy", "cold", "rainy"], topNote: "薰衣草、迷迭香、香檸檬", heartNote: "玫瑰、鳶尾根、香草蘭", baseNote: "香草、零陵香豆、白麝香", style: "溫柔舒眠的薰衣草香草調", intensity: "淡香水 (EDT)", perfumeImageUrl: "/looks/perfume-lavender.jpg" },
];

/** 以 DB 版本覆寫妝容/香水 lookbook（管理員後台編輯後，客戶端載入時呼叫）。 */
export function setMakeupLookbook(list: Makeup[]): void {
  if (list.length) MAKEUP_LOOKBOOK = list;
}
export function setPerfumeLookbook(list: Perfume[]): void {
  if (list.length) PERFUME_LOOKBOOK = list;
}

/** Seed 來源（給後台首次匯入 DB 用，不受覆寫影響）。 */
export const SEED_MAKEUP: Makeup[] = [...MAKEUP_LOOKBOOK];
export const SEED_PERFUME: Perfume[] = [...PERFUME_LOOKBOOK];

/* ═══════════════════════════════════════════════════════════════════════════
   TRANSLATION DICTIONARIES
   ═══════════════════════════════════════════════════════════════════════════ */
export const TRANSLATE = {
  category: { tops: "上衣", bottoms: "下著", outerwear: "外套", accessories: "配件" } as Record<Category, string>,
  season: { spring: "春", summer: "夏", autumn: "秋", winter: "冬" } as Record<Season, string>,
  weather: { sunny: "晴天 ☀️", cloudy: "多雲 ☁️", rainy: "雨天 🌧️", cold: "寒冷 ❄️" } as Record<string, string>,
  mood: { 活力: "活力 ⚡", 放鬆: "放鬆 ☕", 專業: "專業 💼", 優雅: "優雅 🌹", 舒適: "舒適 🧸" } as Record<string, string>,
  destination: { 工作: "工作 💻", 約會: "約會 💕", 休閒漫步: "休閒漫步 🚶", 社交聚會: "社交聚會 🎉", 居家: "居家 🏡" } as Record<string, string>,
  gender: { female: "女生 👩", male: "男生 👨", unisex: "不分性別 🌈" } as Record<Gender, string>,
};

/**
 * Chinese colour name → representative hex, for swatches in the insights view.
 * Covers every colour used by the catalog (37) plus the curated defaults.
 * Unknown names should fall back to a neutral grey at the call site.
 */
export const COLOR_HEX: Record<string, string> = {
  黑色: "#1a1a1a", 白色: "#f4f4f2", 灰色: "#9ca3af", 碳灰: "#36393f", 麻灰: "#b6b1a8",
  藍色: "#2f5fb0", 淡藍色: "#a9c7e8", 藏青: "#1f2d50", 藍綠: "#1f8a8a", 土耳其藍: "#1ca9c9",
  紅色: "#c0392b", 紅格紋: "#b23a3a", 酒紅: "#6e1f2a", 勃根地紅: "#5c1a2b", 鏽紅: "#9c4a2f", 洋紅: "#c2186a",
  粉色: "#f4b6c2", 蜜桃色: "#ffc2a3",
  綠色: "#3a9d5d", 墨綠: "#14532d", 海綠: "#2e8b76",
  紫色: "#7d4fa0", 淺紫: "#c9b6e4", 薰衣草紫: "#b39ddb",
  黃色: "#f2c744", 芥末黃: "#c9a227",
  橘色: "#e8853a", 焦糖色: "#b5712b",
  咖啡色: "#6f4e37", 棕褐: "#8a6d52", 古銅: "#7a5230",
  米色: "#e6d8bf", 米白色: "#f0ebe0", 奶油色: "#f5ecd2", 卡其色: "#b8a172", 裸色: "#e3c4ad",
  金色: "#c8a24a", 銀色: "#c8ccce", 銅色: "#b06b3a",
  多色: "#a8a29e",
};
