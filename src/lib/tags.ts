// Single source of truth for the style tags a user can assign to a garment.
// Both the upload modal (assign) and the closet filter sidebar (filter) read
// this so the two lists can't drift apart (previously the filter offered only
// 4 of the 7 assignable tags, making the rest unfilterable).
export const STYLE_TAGS = [
  "放鬆",
  "工作",
  "專業",
  "約會",
  "優雅",
  "活力",
  "舒適",
] as const;

export type StyleTag = (typeof STYLE_TAGS)[number];
