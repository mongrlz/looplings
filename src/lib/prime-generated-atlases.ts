import type { PrimeResolvedVariation } from '@/lib/prime-variation-model';

export const PRIME_FACTORY_ATLAS_VERSION = 'prime-generated-atlas-pack-v1';
export const PRIME_FACTORY_DEFAULT_SEED = 'prime-genesis';
export const PRIME_FACTORY_DEFAULT_COUNT = 24;

export function getPrimeFactoryAtlasUrl(variation: PrimeResolvedVariation) {
  if (variation.seed !== PRIME_FACTORY_DEFAULT_SEED) return null;
  if (variation.serial < 0 || variation.serial >= PRIME_FACTORY_DEFAULT_COUNT) return null;

  return `/pets/prime-test/generated/${variation.seed}/${variation.tokenId}/state-atlas.png?v=${PRIME_FACTORY_ATLAS_VERSION}`;
}

export function getPrimeFactoryMetadataUrl(variation: PrimeResolvedVariation) {
  if (variation.seed !== PRIME_FACTORY_DEFAULT_SEED) return null;
  if (variation.serial < 0 || variation.serial >= PRIME_FACTORY_DEFAULT_COUNT) return null;

  return `/pets/prime-test/generated/${variation.seed}/${variation.tokenId}/metadata.json?v=${PRIME_FACTORY_ATLAS_VERSION}`;
}
