import { useMemo, useState } from 'react';
import { BadgeCheck, Copy, Dices, Eye, Palette, RadioTower, Sparkles } from 'lucide-react';
import PrimeVariationAtlasSprite from '@/components/sprites/PrimeVariationAtlasSprite';
import { getPrimeFactoryAtlasUrl } from '@/lib/prime-generated-atlases';
import {
  PRIME_VARIATION_AXES_V1,
  PRIME_VARIATION_OPTIONS_V1,
  createPrimeVariations,
  getPrimeVariationCombinationCount,
  getPrimeVariationTraits,
  type PrimeResolvedVariation,
  type PrimeVariationRarity,
} from '@/lib/prime-variation-model';

const COUNT_OPTIONS = [12, 24, 48, 96] as const;

function formatAxis(axis: string) {
  return axis.replace(/_/g, ' ');
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function rarityRank(rarity: PrimeVariationRarity) {
  switch (rarity) {
    case 'legendary':
      return 4;
    case 'rare':
      return 3;
    case 'uncommon':
      return 2;
    default:
      return 1;
  }
}

function highestRarity(variation: PrimeResolvedVariation): PrimeVariationRarity {
  const rarities = [
    variation.bodyPalette.rarity,
    variation.eyeStyle.rarity,
    variation.antennaShape.rarity,
    variation.antennaColor.rarity,
    variation.foreheadMark.rarity,
    variation.expressionSet.rarity,
  ];

  return rarities.sort((a, b) => rarityRank(b) - rarityRank(a))[0];
}

function TraitRow({ label, value, rarity }: { label: string; value: string; rarity: PrimeVariationRarity }) {
  return (
    <div className="variation-lab-trait-row">
      <span>{label}</span>
      <strong>{value}</strong>
      <em className={`is-${rarity}`}>{rarity}</em>
    </div>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="variation-lab-swatch" title={label} style={{ background: color }} />
  );
}

function FactorySprite({ variation, size }: { variation: PrimeResolvedVariation; size: 'sm' | 'lg' }) {
  const factoryAtlasUrl = getPrimeFactoryAtlasUrl(variation);

  return (
    <PrimeVariationAtlasSprite
      variation={variation}
      size={size}
      atlasUrl={factoryAtlasUrl}
      rendererLabel={factoryAtlasUrl ? 'factory atlas' : 'runtime preview'}
      useRuntimeRecolor={!factoryAtlasUrl}
    />
  );
}

export default function VariationsLabPage() {
  const [seed, setSeed] = useState('prime-genesis');
  const [count, setCount] = useState<(typeof COUNT_OPTIONS)[number]>(24);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const variations = useMemo(() => createPrimeVariations(seed, count), [count, seed]);
  const selected = variations[selectedIndex] ?? variations[0];
  const combinationCount = getPrimeVariationCombinationCount();
  const traits = selected ? getPrimeVariationTraits(selected) : null;
  const generationPrompt = selected
    ? [
        selected.bodyPalette.promptTag,
        selected.eyeStyle.promptTag,
        selected.antennaShape.promptTag,
        selected.antennaColor.promptTag,
        selected.foreheadMark.promptTag,
        selected.expressionSet.promptTag,
      ].join('; ')
    : '';

  function randomizeSeed() {
    setSelectedIndex(0);
    setSeed(`prime-${Date.now().toString(36)}`);
  }

  return (
    <main className="variation-lab-page">
      <section className="variation-lab-shell">
        <header className="variation-lab-header">
          <div>
            <p>Looplings Variation Lab</p>
            <h1>Prime L01 collectible genome</h1>
          </div>
          <div className="variation-lab-actions">
            <label>
              Seed
              <input value={seed} onChange={(event) => { setSeed(event.target.value); setSelectedIndex(0); }} />
            </label>
            <label>
              Batch
              <select value={count} onChange={(event) => { setCount(Number(event.target.value) as typeof count); setSelectedIndex(0); }}>
                {COUNT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <button type="button" onClick={randomizeSeed}>
              <Dices size={16} />
              Randomize
            </button>
          </div>
        </header>

        <section className="variation-lab-overview">
          <div className="variation-lab-panel">
            <h2><Sparkles size={16} /> Factory V1</h2>
            <div className="variation-lab-axis-grid">
              {PRIME_VARIATION_AXES_V1.map((axis) => (
                <div key={axis}>
                  <span>{formatAxis(axis)}</span>
                  <strong>{PRIME_VARIATION_OPTIONS_V1[axis].length}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="variation-lab-panel">
            <h2><BadgeCheck size={16} /> Supply Math</h2>
            <div className="variation-lab-metric">
              <strong>{formatNumber(combinationCount)}</strong>
              <span>possible V1 visual genomes</span>
            </div>
          </div>
          <div className="variation-lab-panel">
            <h2><RadioTower size={16} /> Signal Trait</h2>
            <div className="variation-lab-color-row">
              {PRIME_VARIATION_OPTIONS_V1.antenna_color.map((option) => (
                <Swatch key={option.id} color={option.color} label={option.label} />
              ))}
            </div>
          </div>
          <div className="variation-lab-panel variation-lab-renderer-note">
            <h2><BadgeCheck size={16} /> Renderer Status</h2>
            <p>Default seed loads offline generated state atlases. Random seeds fall back to runtime preview until their atlases are exported by the factory script.</p>
          </div>
        </section>

        <section className="variation-lab-layout">
          <section className="variation-lab-panel variation-lab-grid-panel">
            <h2><Palette size={16} /> Generated Batch</h2>
            <div className="variation-lab-grid">
              {variations.map((variation, index) => (
                <button
                  key={variation.id}
                  className={index === selectedIndex ? 'is-active' : undefined}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                >
                  <FactorySprite variation={variation} size="sm" />
                  <span>{variation.tokenId}</span>
                  <em className={`is-${highestRarity(variation)}`}>{highestRarity(variation)}</em>
                </button>
              ))}
            </div>
          </section>

          {selected && (
            <aside className="variation-lab-detail">
              <div className="variation-lab-panel variation-lab-selected">
                <div className="variation-lab-selected-topline">
                  <span>{selected.tokenId}</span>
                  <strong className={`is-${highestRarity(selected)}`}>{highestRarity(selected)}</strong>
                </div>
                <FactorySprite variation={selected} size="lg" />
                <div className="variation-lab-palette-strip">
                  <Swatch color={selected.bodyPalette.colors.body} label="body" />
                  <Swatch color={selected.bodyPalette.colors.shadow} label="shadow" />
                  <Swatch color={selected.bodyPalette.colors.detail} label="detail" />
                  <Swatch color={selected.antennaColor.color} label="antenna" />
                </div>
              </div>

              <div className="variation-lab-panel">
                <h2><Eye size={16} /> Trait Readout</h2>
                <div className="variation-lab-traits">
                  <TraitRow label="Body Palette" value={selected.bodyPalette.label} rarity={selected.bodyPalette.rarity} />
                  <TraitRow label="Eye Style" value={selected.eyeStyle.label} rarity={selected.eyeStyle.rarity} />
                  <TraitRow label="Antenna Shape" value={selected.antennaShape.label} rarity={selected.antennaShape.rarity} />
                  <TraitRow label="Antenna Color" value={selected.antennaColor.label} rarity={selected.antennaColor.rarity} />
                  <TraitRow label="Forehead Mark" value={selected.foreheadMark.label} rarity={selected.foreheadMark.rarity} />
                  <TraitRow label="Expression Set" value={selected.expressionSet.label} rarity={selected.expressionSet.rarity} />
                </div>
              </div>

              {traits && (
                <div className="variation-lab-panel">
                  <h2><Copy size={16} /> Metadata</h2>
                  <pre>{JSON.stringify(traits, null, 2)}</pre>
                </div>
              )}

              <div className="variation-lab-panel">
                <h2><Sparkles size={16} /> Prompt Tags</h2>
                <p className="variation-lab-prompt">{generationPrompt}</p>
              </div>
            </aside>
          )}
        </section>
      </section>
    </main>
  );
}
