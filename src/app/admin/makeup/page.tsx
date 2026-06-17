"use client";

import { JsonCrud } from "@/components/admin/JsonCrud";

const TEMPLATE = {
  id: "m_new",
  name: "",
  gender: ["female"],
  tags: [],
  weather: ["sunny"],
  focus: "",
  eye: "",
  lip: "",
  blush: "",
  highlight: "",
  colors: ["#000000"],
  makeupImageUrl: "",
};

export default function AdminMakeupPage() {
  return <JsonCrud title="妝容管理" endpoint="/api/admin/makeup" template={TEMPLATE} />;
}
