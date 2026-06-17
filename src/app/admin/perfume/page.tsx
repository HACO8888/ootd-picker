"use client";

import { JsonCrud } from "@/components/admin/JsonCrud";

const TEMPLATE = {
  id: "p_new",
  name: "",
  gender: ["female", "male", "unisex"],
  tags: [],
  weather: ["sunny"],
  topNote: "",
  heartNote: "",
  baseNote: "",
  style: "",
  intensity: "淡香水 (EDT)",
  perfumeImageUrl: "",
};

export default function AdminPerfumePage() {
  return <JsonCrud title="香水管理" endpoint="/api/admin/perfume" template={TEMPLATE} />;
}
