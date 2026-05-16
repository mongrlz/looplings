import fs from 'node:fs/promises';
import path from 'node:path';
import { FROZEN_ATLAS_VARIANTS } from '../src/lib/loopling-generator.ts';

const root = process.cwd();
const targetSupply = 22000;
const approvedLooks = FROZEN_ATLAS_VARIANTS.length;
const baseEditionSize = Math.floor(targetSupply / approvedLooks);
const remainderLooks = targetSupply % approvedLooks;
const maxEditionSize = baseEditionSize + (remainderLooks > 0 ? 1 : 0);

const variants = FROZEN_ATLAS_VARIANTS.map((variant, index) => {
  const editionCount = baseEditionSize + (index < remainderLooks ? 1 : 0);

  return {
    variantIndex: index,
    variantId: variant.id,
    label: variant.label,
    editionCount,
    firstMintSlot: index + 1,
    lastMintSlot: index + 1 + (editionCount - 1) * approvedLooks,
    atlasUrl: `/pets/${variant.id}/state-atlas.png`,
    metadataUrl: `/pets/${variant.id}/state-atlas.json`,
  };
});

const previewSlots = Array.from({ length: Math.min(64, targetSupply) }, (_, index) => {
  const mintSlot = index + 1;
  const variant = variants[index % approvedLooks];

  return {
    mintSlot,
    tokenId: `L01-${String(mintSlot).padStart(5, '0')}`,
    variantIndex: variant.variantIndex,
    variantId: variant.variantId,
    label: variant.label,
    atlasUrl: variant.atlasUrl,
  };
});

const allocation = {
  schemaVersion: 'looplings-tier1-allocation-preview.v1',
  targetSupply,
  approvedLooks,
  baseEditionSize,
  remainderLooks,
  maxEditionSize,
  policy: {
    walletOnlyMode: {
      deterministic: true,
      editionCapGuaranteed: false,
      note: 'Hashing wallet address directly into the approved-look set is deterministic, but it cannot guarantee exact edition counts across the whole supply.',
    },
    mintSlotMode: {
      deterministic: true,
      editionCapGuaranteed: true,
      rule: 'variantIndex = (mintSlot - 1) % approvedLooks',
      note: 'Mint-slot assignment is the supply-capped export policy. Wallet seed can still drive personality fields, but the visual edition cap comes from the slot.',
    },
  },
  variants,
  previewSlots,
};

const outPath = path.join(root, 'public/nft-gen-lab/tier1-allocation-preview.json');
await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, `${JSON.stringify(allocation, null, 2)}\n`);

console.log(JSON.stringify({
  outPath: path.relative(root, outPath),
  targetSupply,
  approvedLooks,
  maxEditionSize,
  previewSlots: previewSlots.length,
}, null, 2));
