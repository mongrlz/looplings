import { FROZEN_ATLAS_VARIANT_COUNT } from '@/lib/loopling-generator';

export const TIER1_TARGET_SUPPLY = 22000;
export const FRAMES_PER_ATLAS = 12 * 8;

export interface Tier1Milestone {
  id: string;
  label: string;
  requiredLooks: number;
  editionSize: number;
  status: 'current' | 'next' | 'future';
  note: string;
}

export interface Tier1MintPlan {
  targetSupply: number;
  currentApprovedLooks: number;
  framesPerAtlas: number;
  currentApprovedFrames: number;
  baseEditionSize: number;
  remainderEditions: number;
  maxEditionSize: number;
  looksNeededForMaxEdition100: number;
  looksNeededForMaxEdition50: number;
  looksNeededForMaxEdition20: number;
  looksNeededForOneOfOne: number;
  milestones: Tier1Milestone[];
}

function looksNeededForEditionSize(editionSize: number) {
  return Math.ceil(TIER1_TARGET_SUPPLY / editionSize);
}

export function getTier1MintPlan(approvedLooks = FROZEN_ATLAS_VARIANT_COUNT): Tier1MintPlan {
  const baseEditionSize = Math.floor(TIER1_TARGET_SUPPLY / approvedLooks);
  const remainderEditions = TIER1_TARGET_SUPPLY % approvedLooks;
  const maxEditionSize = baseEditionSize + (remainderEditions > 0 ? 1 : 0);

  return {
    targetSupply: TIER1_TARGET_SUPPLY,
    currentApprovedLooks: approvedLooks,
    framesPerAtlas: FRAMES_PER_ATLAS,
    currentApprovedFrames: approvedLooks * FRAMES_PER_ATLAS,
    baseEditionSize,
    remainderEditions,
    maxEditionSize,
    looksNeededForMaxEdition100: looksNeededForEditionSize(100),
    looksNeededForMaxEdition50: looksNeededForEditionSize(50),
    looksNeededForMaxEdition20: looksNeededForEditionSize(20),
    looksNeededForOneOfOne: TIER1_TARGET_SUPPLY,
    milestones: [
      {
        id: 'lab-proof',
        label: 'Current Lab Proof',
        requiredLooks: approvedLooks,
        editionSize: maxEditionSize,
        status: 'current',
        note: 'Good enough to prove wallet determinism and marketplace-safe full-atlas exports.',
      },
      {
        id: 'tier1-100',
        label: 'Tier 1 Batch Floor',
        requiredLooks: looksNeededForEditionSize(100),
        editionSize: 100,
        status: 'next',
        note: 'First serious mint target: no visual repeats above 100 wallets per finished atlas.',
      },
      {
        id: 'tier1-50',
        label: 'Tier 1 Strong',
        requiredLooks: looksNeededForEditionSize(50),
        editionSize: 50,
        status: 'future',
        note: 'Needs real eye-style and row-pack generation, but still feasible without one-of-one art.',
      },
      {
        id: 'tier1-20',
        label: 'Tier 1 Premium',
        requiredLooks: looksNeededForEditionSize(20),
        editionSize: 20,
        status: 'future',
        note: 'Requires a larger frozen-atlas trait library and stronger visual QA automation.',
      },
      {
        id: 'tier1-unique',
        label: 'True One-of-One',
        requiredLooks: TIER1_TARGET_SUPPLY,
        editionSize: 1,
        status: 'future',
        note: 'Every wallet gets a unique full atlas. This is the north star, not the current lab batch.',
      },
    ],
  };
}
