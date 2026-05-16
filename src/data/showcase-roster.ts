export type ShowcaseTier = "founder" | "approved" | "rough";

export interface ShowcaseCharacter {
  id: string;
  name: string;
  lineage: string;
  tier: ShowcaseTier;
}

export const DEFAULT_CHARACTER_ID = "prime-test";

export const SHOWCASE_ROSTER: ShowcaseCharacter[] = [
  { id: "prime-test",              name: "Prime",          lineage: "L00 / GENESIS", tier: "founder" },

  { id: "lab-ai-apricot-button",   name: "Apricot Button", lineage: "L01 / LAB AI",  tier: "approved" },
  { id: "lab-ai-aurora-ring",      name: "Aurora Ring",    lineage: "L01 / LAB AI",  tier: "approved" },
  { id: "lab-ai-blue-twin",        name: "Blue Twin",      lineage: "L01 / LAB AI",  tier: "approved" },
  { id: "lab-ai-cobalt-pebble",    name: "Cobalt Pebble",  lineage: "L01 / LAB AI",  tier: "approved" },
  { id: "lab-ai-ember-kite",       name: "Ember Kite",     lineage: "L01 / LAB AI",  tier: "approved" },
  { id: "lab-ai-lavender-star",    name: "Lavender Star",  lineage: "L01 / LAB AI",  tier: "approved" },
  { id: "lab-ai-nova-star",        name: "Nova Star",      lineage: "L01 / LAB AI",  tier: "approved" },
  { id: "lab-ai-peach-sundot",     name: "Peach Sundot",   lineage: "L01 / LAB AI",  tier: "approved" },
  { id: "lab-ai-pearl-ring",       name: "Pearl Ring",     lineage: "L01 / LAB AI",  tier: "approved" },
  { id: "lab-ai-seafoam-leaf",     name: "Seafoam Leaf",   lineage: "L01 / LAB AI",  tier: "approved" },
  { id: "lab-ai-sky-ring",         name: "Sky Ring",       lineage: "L01 / LAB AI",  tier: "approved" },
  { id: "lab-ai-spark-ring",       name: "Spark Ring",     lineage: "L01 / LAB AI",  tier: "approved" },
  { id: "lab-ai-storm-loop",       name: "Storm Loop",     lineage: "L01 / LAB AI",  tier: "approved" },
  { id: "lab-ai-verdant-leaf",     name: "Verdant Leaf",   lineage: "L01 / LAB AI",  tier: "approved" },
  { id: "lab-ai-violet-bow",       name: "Violet Bow",     lineage: "L01 / LAB AI",  tier: "approved" },

  { id: "graphite",                name: "Graphite",       lineage: "L01 / SEED",    tier: "approved" },
  { id: "mint",                    name: "Mint",           lineage: "L01 / SEED",    tier: "approved" },
  { id: "pink",                    name: "Pink",           lineage: "L01 / SEED",    tier: "approved" },

  { id: "path-d-graphite-rune",    name: "Graphite Rune",  lineage: "L01 / PATH-D",  tier: "rough" },
  { id: "path-d-lavender-halo",    name: "Lavender Halo",  lineage: "L01 / PATH-D",  tier: "rough" },
  { id: "path-d-prime-pearl",      name: "Prime Pearl",    lineage: "L01 / PATH-D",  tier: "rough" },
];

export function findCharacter(id: string): ShowcaseCharacter | undefined {
  return SHOWCASE_ROSTER.find((c) => c.id === id);
}

export function resolveCharacterId(maybeId: string | null | undefined): string {
  if (!maybeId) return DEFAULT_CHARACTER_ID;
  return findCharacter(maybeId) ? maybeId : DEFAULT_CHARACTER_ID;
}
