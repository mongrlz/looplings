import fs from 'node:fs/promises';
import path from 'node:path';
import {
  PATH_D_CANDIDATES,
} from '../src/lib/path-d-casting.ts';
import {
  FROZEN_ATLAS_VARIANTS,
  QUARANTINED_MOTION_REVIEW_LAB_ATLAS_VARIANTS,
  QUARANTINED_PALETTE_BAKED_ATLAS_VARIANTS,
  QUARANTINED_RECYCLED_ANIMATION_ATLAS_VARIANTS,
  QUARANTINED_RECYCLED_LAB_ATLAS_VARIANTS,
} from '../src/lib/loopling-generator.ts';

const root = process.cwd();
const petsDir = path.join(root, 'public/pets');
const outPath = path.join(root, 'public/nft-gen-lab/generated-sprite-index.json');
const auditPath = path.join(root, 'public/nft-gen-lab/atlas-audit.json');
const rejectedAtlasDir = path.join(root, 'public/nft-gen-lab/rejected-atlases');

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function publicUrl(filePath) {
  return `/${path.relative(path.join(root, 'public'), filePath).split(path.sep).join('/')}`;
}

function titleFromId(id) {
  return id
    .replace(/^lab-ai-/, '')
    .replace(/^lab-/, '')
    .replace(/^path-d-/, '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function atlasFamily(id, status, sourceKind) {
  if (id.startsWith('path-d-')) return 'Path D graduate';
  if (id.startsWith('lab-ai-')) return status === 'motion-review' ? 'Motion review atlas' : 'AI-authored atlas';
  if (id.startsWith('lab-')) return 'Palette bake';
  if (sourceKind === 'offline-palette-bake') return 'Palette bake';
  if (status === 'rejected') return 'Legacy rejected atlas';
  return 'Legacy pet atlas';
}

const approvedIds = new Set(FROZEN_ATLAS_VARIANTS.map((item) => item.id));
const paletteBakeIds = new Set(QUARANTINED_PALETTE_BAKED_ATLAS_VARIANTS.map((item) => item.id));
const recycledIds = new Set([
  ...QUARANTINED_RECYCLED_ANIMATION_ATLAS_VARIANTS,
  ...QUARANTINED_RECYCLED_LAB_ATLAS_VARIANTS,
].map((item) => item.id));
const motionReviewIds = new Set(QUARANTINED_MOTION_REVIEW_LAB_ATLAS_VARIANTS.map((item) => item.id));
const variantById = new Map([
  ...FROZEN_ATLAS_VARIANTS,
  ...QUARANTINED_PALETTE_BAKED_ATLAS_VARIANTS,
  ...QUARANTINED_RECYCLED_ANIMATION_ATLAS_VARIANTS,
  ...QUARANTINED_RECYCLED_LAB_ATLAS_VARIANTS,
  ...QUARANTINED_MOTION_REVIEW_LAB_ATLAS_VARIANTS,
].map((item) => [item.id, item]));
const pathDByAtlasId = new Map(
  PATH_D_CANDIDATES
    .filter((candidate) => candidate.atlasUrl)
    .map((candidate) => [candidate.intendedAtlasId, candidate]),
);
const audit = await readJson(auditPath);
const auditById = new Map((audit?.results ?? []).map((item) => [item.id, item]));
const entries = [];

for (const entry of (await fs.readdir(petsDir, { withFileTypes: true })).filter((item) => item.isDirectory())) {
  const id = entry.name;
  const dir = path.join(petsDir, id);
  const atlasPath = path.join(dir, 'state-atlas.png');
  const spritesheetPath = path.join(dir, 'spritesheet.webp');
  const atlasJsonPath = path.join(dir, 'state-atlas.json');
  const petJsonPath = path.join(dir, 'pet.json');
  const hasAtlas = await exists(atlasPath);
  const hasSpritesheet = await exists(spritesheetPath);

  if (!hasAtlas && !hasSpritesheet) continue;

  const atlasMeta = await readJson(atlasJsonPath);
  const petMeta = await readJson(petJsonPath);
  const variant = variantById.get(id);
  const pathDCandidate = pathDByAtlasId.get(id);
  const auditResult = auditById.get(id);
  const status = auditResult?.status === 'rejected'
    ? 'rejected'
    : approvedIds.has(id)
      ? 'generator-approved'
      : paletteBakeIds.has(id)
        ? 'quarantined-palette-bake'
        : recycledIds.has(id)
          ? 'quarantined-recycled'
          : motionReviewIds.has(id)
            ? 'motion-review'
            : hasAtlas
              ? 'technically-valid'
              : 'spritesheet-only';

  entries.push({
    id,
    label: atlasMeta?.displayName ?? petMeta?.displayName ?? variant?.label ?? pathDCandidate?.label ?? titleFromId(id),
    kind: hasAtlas ? 'state-atlas' : 'codex-spritesheet',
    family: hasAtlas ? atlasFamily(id, status, variant?.sourceKind) : 'Codex pet spritesheet',
    status,
    source: atlasMeta?.source ?? (hasSpritesheet ? 'codex-pet-spritesheet' : 'unknown'),
    atlasUrl: hasAtlas ? publicUrl(atlasPath) : undefined,
    spritesheetUrl: hasSpritesheet ? publicUrl(spritesheetPath) : undefined,
    metadataUrl: await exists(atlasJsonPath) ? publicUrl(atlasJsonPath) : undefined,
    petJsonUrl: await exists(petJsonPath) ? publicUrl(petJsonPath) : undefined,
    candidateId: atlasMeta?.candidateId ?? pathDCandidate?.id,
    audit: auditResult
      ? {
          status: auditResult.status,
          detachedFrameCount: auditResult.detachedFrameCount,
          size: auditResult.size,
        }
      : undefined,
    traits: variant
      ? {
          bodyPalette: variant.bodyPalette,
          eyeStyle: variant.eyeStyle,
          antennaShape: variant.antennaShape,
          antennaColor: variant.antennaColor,
          foreheadGlyph: variant.foreheadGlyph,
        }
      : pathDCandidate?.traits,
    rows: atlasMeta?.rows,
  });
}

for (const candidate of PATH_D_CANDIDATES) {
  entries.push({
    id: candidate.id,
    label: candidate.label,
    kind: 'path-d-candidate',
    family: candidate.status === 'atlas-approved' ? 'Path D casting plus graduate' : 'Path D casting',
    status: candidate.status,
    source: 'path-d-casting-sheet',
    candidateUrl: candidate.candidateUrl,
    atlasUrl: candidate.atlasUrl,
    metadataUrl: candidate.metadataUrl,
    intendedAtlasId: candidate.intendedAtlasId,
    traits: candidate.traits,
  });
}

if (await exists(rejectedAtlasDir)) {
  for (const entry of (await fs.readdir(rejectedAtlasDir, { withFileTypes: true })).filter((item) => item.isDirectory())) {
    const id = entry.name;
    const dir = path.join(rejectedAtlasDir, id);
    const atlasPath = path.join(dir, 'state-atlas.png');
    const atlasJsonPath = path.join(dir, 'state-atlas.json');

    if (!await exists(atlasPath)) continue;

    const atlasMeta = await readJson(atlasJsonPath);

    entries.push({
      id,
      label: atlasMeta?.displayName ?? titleFromId(id),
      kind: 'rejected-atlas',
      family: 'Rejected atlas experiment',
      status: 'rejected-lab',
      source: atlasMeta?.source ?? 'rejected-atlas-lab',
      atlasUrl: publicUrl(atlasPath),
      metadataUrl: await exists(atlasJsonPath) ? publicUrl(atlasJsonPath) : undefined,
      rows: atlasMeta?.rows,
    });
  }
}

const sortOrder = {
  'state-atlas': 0,
  'codex-spritesheet': 1,
  'path-d-candidate': 2,
  'rejected-atlas': 3,
};
entries.sort((a, b) => (sortOrder[a.kind] - sortOrder[b.kind]) || a.label.localeCompare(b.label));

const stats = {
  totalEntries: entries.length,
  uniquePetFolders: entries.filter((entry) => entry.kind === 'state-atlas' || entry.kind === 'codex-spritesheet').length,
  stateAtlases: entries.filter((entry) => entry.kind === 'state-atlas').length,
  spritesheetOnly: entries.filter((entry) => entry.kind === 'codex-spritesheet').length,
  pathDCandidates: entries.filter((entry) => entry.kind === 'path-d-candidate').length,
  pathDGraduates: entries.filter((entry) => entry.kind === 'state-atlas' && entry.id.startsWith('path-d-')).length,
  rejectedAtlasExperiments: entries.filter((entry) => entry.kind === 'rejected-atlas').length,
  generatorApproved: entries.filter((entry) => entry.status === 'generator-approved').length,
  technicallyValidAtlases: entries.filter((entry) => entry.kind === 'state-atlas' && entry.audit?.status === 'approved').length,
  rejectedPublicPetAtlases: entries.filter((entry) => entry.kind === 'state-atlas' && entry.audit?.status === 'rejected').length,
};

const manifest = {
  schemaVersion: 'looplings-generated-sprite-index.v1',
  generatedAt: new Date().toISOString(),
  stats,
  entries,
};

await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(stats, null, 2));
