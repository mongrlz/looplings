import { FROZEN_ATLAS_VARIANTS } from '@/lib/loopling-generator';
import { TIER1_TARGET_SUPPLY } from '@/lib/tier1-mint-plan';

export interface Tier1VariantAllocation {
  variantId: string;
  label: string;
  editionCount: number;
  firstMintSlot: number;
  lastMintSlot: number;
}

export interface Tier1AllocationSummary {
  targetSupply: number;
  approvedLooks: number;
  walletOnlyMode: {
    deterministic: true;
    editionCapGuaranteed: false;
    note: string;
  };
  mintSlotMode: {
    deterministic: true;
    editionCapGuaranteed: true;
    maxEditionSize: number;
    baseEditionSize: number;
    remainderLooks: number;
    note: string;
  };
  variants: Tier1VariantAllocation[];
}

export function getVariantIndexForMintSlot(mintSlot: number, approvedLooks = FROZEN_ATLAS_VARIANTS.length) {
  const slotIndex = Math.max(0, Math.floor(mintSlot) - 1);
  return slotIndex % approvedLooks;
}

export function getTier1AllocationSummary(): Tier1AllocationSummary {
  const approvedLooks = FROZEN_ATLAS_VARIANTS.length;
  const baseEditionSize = Math.floor(TIER1_TARGET_SUPPLY / approvedLooks);
  const remainderLooks = TIER1_TARGET_SUPPLY % approvedLooks;
  const maxEditionSize = baseEditionSize + (remainderLooks > 0 ? 1 : 0);
  const variants = FROZEN_ATLAS_VARIANTS.map((variant, index) => {
    const editionCount = baseEditionSize + (index < remainderLooks ? 1 : 0);
    const firstMintSlot = index + 1;
    const lastMintSlot = index + 1 + (editionCount - 1) * approvedLooks;

    return {
      variantId: variant.id,
      label: variant.label,
      editionCount,
      firstMintSlot,
      lastMintSlot,
    };
  });

  return {
    targetSupply: TIER1_TARGET_SUPPLY,
    approvedLooks,
    walletOnlyMode: {
      deterministic: true,
      editionCapGuaranteed: false,
      note: 'Wallet hash alone always gives the same visual for the same wallet, but supply-wide rarity is probabilistic unless the mint stores a slot assignment.',
    },
    mintSlotMode: {
      deterministic: true,
      editionCapGuaranteed: true,
      maxEditionSize,
      baseEditionSize,
      remainderLooks,
      note: 'Mint slot allocation gives each token a deterministic visual index and guarantees exact edition caps for a fixed supply.',
    },
    variants,
  };
}
