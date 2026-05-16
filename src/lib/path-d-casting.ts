export interface PathDCandidate {
  id: string;
  label: string;
  candidateUrl: string;
  sourceSheetUrl: string;
  row: number;
  column: number;
  status: 'casting-approved' | 'atlas-generating' | 'atlas-qa' | 'atlas-approved';
  intendedAtlasId: string;
  atlasUrl?: string;
  metadataUrl?: string;
  traits: {
    bodyPalette: string;
    eyeStyle: string;
    antennaLoop: string;
    foreheadGlyph: string;
  };
}

export const PATH_D_SOURCE_SHEET = '/nft-gen-lab/path-d/casting-sheet-batch-001.png';

export const PATH_D_CANDIDATES: PathDCandidate[] = [
  ['d-001', 'Prime Pearl', 'Pearl White', 'Blue Gloss', 'Canon Ring', 'Gold Spark'],
  ['d-002', 'Rose Heartline', 'Blush Pink', 'Rose Gloss', 'Heart Loop', 'Heart Glyph'],
  ['d-003', 'Sky Oath', 'Sky Blue', 'Blue Gloss', 'Canon Ring', 'Blue Diamond'],
  ['d-004', 'Mint Orbit', 'Mint Aqua', 'Teal Gloss', 'Double Orbit', 'Teal Diamond'],
  ['d-005', 'Lavender Halo', 'Pearl Lavender', 'Violet Gloss', 'Wide Halo', 'Violet Diamond'],
  ['d-006', 'Gold Signal', 'Signal Gold', 'Gold Gloss', 'Spark Ring', 'Gold Diamond'],
  ['d-007', 'Graphite Rune', 'Graphite Gray', 'Violet Gloss', 'Cool Ring', 'Ice Rune'],
  ['d-008', 'Coral Relay', 'Coral Red', 'Rose Gloss', 'Signal Ring', 'Coral Diamond'],
  ['d-009', 'Aqua Core', 'Aqua Cyan', 'Teal Gloss', 'Aqua Ring', 'Aqua Core'],
  ['d-010', 'Violet Ripple', 'Violet Grape', 'Violet Gloss', 'Ripple Ring', 'Violet Rune'],
  ['d-011', 'Peach Bloom', 'Peach Cream', 'Pink Gloss', 'Bloom Ring', 'Flower Glyph'],
  ['d-012', 'Cobalt Star', 'Cobalt Blue', 'Blue Gloss', 'Cobalt Ring', 'Star Glyph'],
  ['d-013', 'Amber Halo', 'Amber Gold', 'Teal Gloss', 'Amber Ring', 'Amber Diamond'],
  ['d-014', 'Moon Crescent', 'Moon Gray', 'Violet Gloss', 'Silver Ring', 'Crescent Glyph'],
  ['d-015', 'Pearl Frost', 'Frost Pearl', 'Blue Gloss', 'Ice Ring', 'Snow Diamond'],
  ['d-016', 'Lime Sigil', 'Lime Green', 'Teal Gloss', 'Lime Ring', 'Leaf Sigil'],
  ['d-017', 'Deep Violet', 'Deep Violet', 'Violet Gloss', 'Violet Ring', 'Star Diamond'],
  ['d-018', 'Solar Glyph', 'Solar Cream', 'Gold Gloss', 'Solar Ring', 'Sun Glyph'],
  ['d-019', 'Ice Snow', 'Ice Blue', 'Blue Gloss', 'Ice Ring', 'Snowflake Glyph'],
  ['d-020', 'Teal Circuit', 'Deep Teal', 'Teal Gloss', 'Circuit Ring', 'Circuit Glyph'],
  ['d-021', 'Apricot Ember', 'Apricot Orange', 'Gold Gloss', 'Ember Ring', 'Ember Diamond'],
  ['d-022', 'Rose Relay', 'Dusty Rose', 'Rose Gloss', 'Rose Ring', 'Relay Glyph'],
  ['d-023', 'Seafoam Eye', 'Seafoam Mint', 'Teal Gloss', 'Eye Ring', 'Eye Diamond'],
  ['d-024', 'Periwinkle Twin', 'Periwinkle Blue', 'Blue Gloss', 'Twin Ring', 'Twin Diamonds'],
  ['d-025', 'Receipt Keeper', 'Parchment Pearl', 'Terminal Square', 'Receipt Loop', 'Data Grid'],
].map((item, index) => {
  const [id, label, bodyPalette, eyeStyle, antennaLoop, foreheadGlyph] = item;
  const row = Math.floor(index / 6);
  const column = index % 6;
  const atlasByCandidate: Record<string, string> = {
    'd-001': 'path-d-prime-pearl',
    'd-005': 'path-d-lavender-halo',
    'd-007': 'path-d-graphite-rune',
    'd-025': 'path-d-receipt-keeper',
  };
  const atlasId = atlasByCandidate[id];

  return {
    id,
    label,
    candidateUrl: `/nft-gen-lab/path-d/candidates/${id}.png`,
    sourceSheetUrl: PATH_D_SOURCE_SHEET,
    row,
    column,
    status: atlasId ? 'atlas-approved' : 'casting-approved',
    intendedAtlasId: atlasId ?? `path-d-${id.replace('d-', '')}`,
    atlasUrl: atlasId ? `/pets/${atlasId}/state-atlas.png` : undefined,
    metadataUrl: atlasId ? `/pets/${atlasId}/state-atlas.json` : undefined,
    traits: {
      bodyPalette,
      eyeStyle,
      antennaLoop,
      foreheadGlyph,
    },
  } satisfies PathDCandidate;
});

export const PATH_D_FRAME_MATH = {
  candidateCount: PATH_D_CANDIDATES.length,
  statesPerCandidate: 12,
  framesPerState: 8,
  get totalStateRows() {
    return this.candidateCount * this.statesPerCandidate;
  },
  get totalFrames() {
    return this.candidateCount * this.statesPerCandidate * this.framesPerState;
  },
};
