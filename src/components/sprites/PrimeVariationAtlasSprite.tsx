import { useEffect, useRef, useState } from 'react';
import {
  PRIME_VARIATION_ATLAS,
  PRIME_VARIATION_ANTENNA_MASK_URL,
  PRIME_VARIATION_ATLAS_URL,
  getPrimeAtlasState,
  getPrimeAntennaLayerUrl,
  renderPrimeAtlasFrame,
  renderPrimeVariationFrame,
} from '@/lib/prime-atlas-renderer';
import type { PrimeVisibleStateId } from '@/lib/prime-asset-factory';
import type { PrimeResolvedVariation } from '@/lib/prime-variation-model';

interface Props {
  variation: PrimeResolvedVariation;
  stateId?: PrimeVisibleStateId;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  atlasUrl?: string | null;
  rendererLabel?: string;
  useRuntimeRecolor?: boolean;
}

const imagePromises = new Map<string, Promise<HTMLImageElement>>();

function loadImage(url: string) {
  const cached = imagePromises.get(url);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load Prime image: ${url}`));
    image.src = url;
  });

  imagePromises.set(url, promise);
  return promise;
}

function pixelWidth(size: NonNullable<Props['size']>) {
  switch (size) {
    case 'sm':
      return 94;
    case 'lg':
      return 286;
    default:
      return 164;
  }
}

export default function PrimeVariationAtlasSprite({
  variation,
  stateId = 'idle',
  size = 'md',
  animated = true,
  atlasUrl,
  rendererLabel,
  useRuntimeRecolor = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [atlasImage, setAtlasImage] = useState<HTMLImageElement | null>(null);
  const [antennaLayerImage, setAntennaLayerImage] = useState<HTMLImageElement | null>(null);
  const [antennaMaskImage, setAntennaMaskImage] = useState<HTMLImageElement | null>(null);
  const [frame, setFrame] = useState(0);
  const state = getPrimeAtlasState(stateId);
  const resolvedAtlasUrl = atlasUrl ?? PRIME_VARIATION_ATLAS_URL;
  const resolvedRendererLabel = rendererLabel ?? (useRuntimeRecolor ? 'real atlas recolor' : 'factory atlas');
  const antennaLayerUrl = variation.antennaShape.id === 'origin-loop'
    ? getPrimeAntennaLayerUrl(variation.antennaShape.id)
    : null;

  useEffect(() => {
    let active = true;
    loadImage(resolvedAtlasUrl)
      .then((image) => {
        if (active) setAtlasImage(image);
      })
      .catch(() => {
        if (active) setAtlasImage(null);
      });

    return () => {
      active = false;
    };
  }, [resolvedAtlasUrl]);

  useEffect(() => {
    if (!useRuntimeRecolor || !antennaLayerUrl) {
      setAntennaLayerImage(null);
      setAntennaMaskImage(null);
      return;
    }

    let active = true;
    Promise.all([
      loadImage(antennaLayerUrl),
      loadImage(PRIME_VARIATION_ANTENNA_MASK_URL),
    ])
      .then(([layerImage, maskImage]) => {
        if (!active) return;
        setAntennaLayerImage(layerImage);
        setAntennaMaskImage(maskImage);
      })
      .catch(() => {
        if (!active) return;
        setAntennaLayerImage(null);
        setAntennaMaskImage(null);
      });

    return () => {
      active = false;
    };
  }, [antennaLayerUrl, useRuntimeRecolor]);

  useEffect(() => {
    setFrame(0);
  }, [stateId, variation.id]);

  useEffect(() => {
    if (!animated || state.fps <= 0 || state.frameCount <= 1) return;
    const interval = window.setInterval(() => {
      setFrame((current) => (current + 1) % state.frameCount);
    }, 1000 / state.fps);
    return () => window.clearInterval(interval);
  }, [animated, state.fps, state.frameCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || !atlasImage) return;
    if (useRuntimeRecolor) {
      renderPrimeVariationFrame(context, atlasImage, variation, stateId, frame, antennaLayerImage, antennaMaskImage);
    } else {
      renderPrimeAtlasFrame(context, atlasImage, stateId, frame);
    }
  }, [antennaLayerImage, antennaMaskImage, atlasImage, frame, stateId, useRuntimeRecolor, variation]);

  const width = pixelWidth(size);
  const height = Math.round(width * (PRIME_VARIATION_ATLAS.cellHeight / PRIME_VARIATION_ATLAS.cellWidth));

  return (
    <div className={`prime-variation-atlas is-${size}`}>
      <canvas
        ref={canvasRef}
        aria-label={`${variation.tokenId} real Prime atlas variation`}
        width={PRIME_VARIATION_ATLAS.cellWidth}
        height={PRIME_VARIATION_ATLAS.cellHeight}
        style={{ width, height }}
      />
      <span>{resolvedRendererLabel}</span>
    </div>
  );
}
