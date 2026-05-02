import type { LooplingVisualStateId } from '@/lib/loopling-traits';

export type PrimeAssetApprovalStatus = 'draft' | 'needs_art' | 'needs_regen' | 'approved' | 'production_locked';
export type PrimeAssetSourceType =
  | 'generated_state_row'
  | 'rig_layout_proxy'
  | 'prototype_remix'
  | 'codex_pet_reference'
  | 'missing';

export type PrimeVisibleStateId = Exclude<LooplingVisualStateId, 'prediction_win'>;

export interface PrimeRigAnchor {
  x: number;
  y: number;
  radius?: number;
  width?: number;
  height?: number;
  note: string;
}

export interface PrimeRigContract {
  id: 'prime-l01';
  version: string;
  cell: {
    width: 192;
    height: 208;
    frameCount: 8;
  };
  identityLocks: string[];
  anchors: {
    headCenter: PrimeRigAnchor;
    bodyCenter: PrimeRigAnchor;
    antennaBase: PrimeRigAnchor;
    antennaTop: PrimeRigAnchor;
    leftEye: PrimeRigAnchor;
    rightEye: PrimeRigAnchor;
    mouth: PrimeRigAnchor;
    leftArm: PrimeRigAnchor;
    rightArm: PrimeRigAnchor;
    leftFoot: PrimeRigAnchor;
    rightFoot: PrimeRigAnchor;
  };
}

export interface PrimeStateContract {
  id: PrimeVisibleStateId;
  label: string;
  row: number;
  frameCount: number;
  fps: number;
  loop: 'loop' | 'once' | 'hold';
  status: PrimeAssetApprovalStatus;
  sourceType: PrimeAssetSourceType;
  currentAsset: string;
  productionRequirement: string;
  rejectionReason?: string;
}

export const PRIME_RIG_CONTRACT: PrimeRigContract = {
  id: 'prime-l01',
  version: 'prime-l01-rig.v1',
  cell: {
    width: 192,
    height: 208,
    frameCount: 8,
  },
  identityLocks: [
    'pearl-white naked/default body with no clothes or props',
    'round chibi head larger than the body',
    'large dark glassy eyes with blue highlights',
    'tiny arms and stubby feet',
    'single glowing loop antenna attached to top of head',
    'small reserved forehead mark centered below antenna',
    'slightly melancholic protected-creature expression',
  ],
  anchors: {
    headCenter: { x: 96, y: 83, radius: 48, note: 'Main head mass center.' },
    bodyCenter: { x: 96, y: 143, width: 68, height: 64, note: 'Small body mass under head.' },
    antennaBase: { x: 96, y: 37, radius: 4, note: 'Loop stem attaches here.' },
    antennaTop: { x: 96, y: 17, radius: 15, note: 'Loop antenna top stays centered unless state pose requires slight sway.' },
    leftEye: { x: 73, y: 91, width: 18, height: 25, note: 'Viewer-left eye socket.' },
    rightEye: { x: 119, y: 91, width: 18, height: 25, note: 'Viewer-right eye socket.' },
    mouth: { x: 96, y: 116, width: 16, height: 8, note: 'Tiny mouth anchor.' },
    leftArm: { x: 53, y: 137, width: 18, height: 30, note: 'Viewer-left arm root and swing area.' },
    rightArm: { x: 139, y: 137, width: 18, height: 30, note: 'Viewer-right arm root and swing area.' },
    leftFoot: { x: 79, y: 176, width: 18, height: 18, note: 'Viewer-left foot.' },
    rightFoot: { x: 113, y: 176, width: 18, height: 18, note: 'Viewer-right foot.' },
  },
};

export const PRIME_VISIBLE_STATE_IDS: PrimeVisibleStateId[] = [
  'idle',
  'thinking',
  'acting',
  'trading',
  'trade_win',
  'trade_loss',
  'posting',
  'receiving',
  'sleeping',
  'low_compute',
  'critical',
  'dead',
];

export const PRIME_STATE_CONTRACTS: Record<PrimeVisibleStateId, PrimeStateContract> = {
  idle: {
    id: 'idle',
    label: 'Idle breathing',
    row: 0,
    frameCount: 8,
    fps: 5,
    loop: 'loop',
    status: 'approved',
    sourceType: 'generated_state_row',
    currentAsset: '/pets/prime-test/state-atlas.png',
    productionRequirement: 'User approved Prime L01 idle as the canonical base visual row.',
  },
  thinking: {
    id: 'thinking',
    label: 'Thinking focus',
    row: 1,
    frameCount: 8,
    fps: 5,
    loop: 'loop',
    status: 'approved',
    sourceType: 'generated_state_row',
    currentAsset: '/pets/prime-test/rows/thinking-row-v1.png',
    productionRequirement: 'User approved the generated Prime L01 thinking row.',
  },
  acting: {
    id: 'acting',
    label: 'Tool action',
    row: 2,
    frameCount: 8,
    fps: 8,
    loop: 'loop',
    status: 'draft',
    sourceType: 'generated_state_row',
    currentAsset: '/pets/prime-test/rows/acting-row-v1.png',
    productionRequirement: 'Draft generated acting row; review body-language read and identity consistency before approval.',
  },
  trading: {
    id: 'trading',
    label: 'Market scan',
    row: 3,
    frameCount: 8,
    fps: 9,
    loop: 'loop',
    status: 'draft',
    sourceType: 'generated_state_row',
    currentAsset: '/pets/prime-test/rows/trading-row-v1.png',
    productionRequirement: 'Draft generated trading row; review alert market-read motion and remove any stray antenna artifacts before approval.',
  },
  trade_win: {
    id: 'trade_win',
    label: 'Trade win bounce',
    row: 4,
    frameCount: 8,
    fps: 8,
    loop: 'once',
    status: 'draft',
    sourceType: 'generated_state_row',
    currentAsset: '/pets/prime-test/rows/trade-win-row-v1.png',
    productionRequirement: 'Draft generated trade win row; review contained celebration read before approval.',
  },
  trade_loss: {
    id: 'trade_loss',
    label: 'Trade loss slump',
    row: 5,
    frameCount: 8,
    fps: 5,
    loop: 'once',
    status: 'draft',
    sourceType: 'generated_state_row',
    currentAsset: '/pets/prime-test/rows/trade-loss-row-v1.png',
    productionRequirement: 'Draft generated trade loss row; review disappointment read without tint drift before approval.',
  },
  posting: {
    id: 'posting',
    label: 'Posting send',
    row: 6,
    frameCount: 8,
    fps: 6,
    loop: 'once',
    status: 'draft',
    sourceType: 'generated_state_row',
    currentAsset: '/pets/prime-test/rows/posting-row-v1.png',
    productionRequirement: 'Draft generated posting row; review outward communication gesture before approval.',
  },
  receiving: {
    id: 'receiving',
    label: 'Receiving listen',
    row: 7,
    frameCount: 8,
    fps: 6,
    loop: 'once',
    status: 'draft',
    sourceType: 'generated_state_row',
    currentAsset: '/pets/prime-test/rows/receiving-row-v1.png',
    productionRequirement: 'Draft generated receiving row; review attentive incoming-signal read before approval.',
  },
  sleeping: {
    id: 'sleeping',
    label: 'Sleeping breath',
    row: 8,
    frameCount: 8,
    fps: 2,
    loop: 'loop',
    status: 'draft',
    sourceType: 'generated_state_row',
    currentAsset: '/pets/prime-test/rows/sleeping-row-v1.png',
    productionRequirement: 'Draft generated sleeping row; review peaceful sleeping read and subtle motion before approval.',
  },
  low_compute: {
    id: 'low_compute',
    label: 'Low compute conserve',
    row: 9,
    frameCount: 8,
    fps: 3,
    loop: 'loop',
    status: 'draft',
    sourceType: 'generated_state_row',
    currentAsset: '/pets/prime-test/rows/low-compute-row-v1.png',
    productionRequirement: 'Draft generated low compute row; review weak/sad read without gray tint before approval.',
  },
  critical: {
    id: 'critical',
    label: 'Critical distress',
    row: 10,
    frameCount: 8,
    fps: 8,
    loop: 'loop',
    status: 'draft',
    sourceType: 'generated_state_row',
    currentAsset: '/pets/prime-test/rows/critical-row-v1.png',
    productionRequirement: 'Draft generated critical row; review panic read without detached effects before approval.',
  },
  dead: {
    id: 'dead',
    label: 'Dead grounded',
    row: 11,
    frameCount: 8,
    fps: 0,
    loop: 'hold',
    status: 'draft',
    sourceType: 'generated_state_row',
    currentAsset: '/pets/prime-test/rows/dead-row-v1.png',
    productionRequirement: 'Draft generated dead row; review collapsed side pose before approval.',
  },
};

export const PRIME_FACTORY_TRAIT_AXES_V1 = [
  'body_palette',
  'eye_style',
  'antenna_style',
  'forehead_mark',
  'expression_set',
] as const;

export const PRIME_FACTORY_TRAIT_AXES_LATER = [
  'clothes',
  'accessories',
] as const;

export function getPrimeStateContract(stateId: LooplingVisualStateId) {
  if (stateId === 'prediction_win') return PRIME_STATE_CONTRACTS.trade_win;
  return PRIME_STATE_CONTRACTS[stateId];
}

export function isPrimeStateProductionApproved(stateId: LooplingVisualStateId) {
  const state = getPrimeStateContract(stateId);
  return state.status === 'approved' || state.status === 'production_locked';
}
