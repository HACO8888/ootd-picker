// Side-effect module: registers the bundled ~1 MB catalog dataset. Import it
// (`import "@/lib/catalog-source"`) only from pages that browse or recommend
// from the catalog, so other routes don't download it.
import data from "./catalog-data.json";
import { registerCatalogSource, type RawItem } from "./catalog";

registerCatalogSource(data as RawItem[]);
