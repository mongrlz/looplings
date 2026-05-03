# Prime Variation Factory

Prime variations must be generated from the approved Prime L01 atlas, not from a CSS redraw of the character.

## Current V1

- Source atlas: `public/pets/prime-test/state-atlas.png`
- Cell size: `192x208`
- Columns: `8`
- Rows: the 12 Prime visual states in `public/pets/prime-test/state-atlas.json`
- Source-pack manifest: `public/pets/prime-test/source-pack/prime-l01-source-pack.v1.json`
- Default generated pack: `public/pets/prime-test/generated/prime-genesis/manifest.json`
- Generator: `npm run generate:prime-variations`
- Preview renderer: `src/components/sprites/PrimeVariationAtlasSprite.tsx`
- Pixel rules: `src/lib/prime-atlas-renderer.ts`

The current factory exports finished animated `state-atlas.png` files before the browser renders them. The default `prime-genesis` lab batch loads those finished atlases directly:

```text
public/pets/prime-test/generated/prime-genesis/
  manifest.json
  L01-00001/state-atlas.png
  L01-00001/metadata.json
  ...
```

V1 uses safe pixel classification from the approved Prime atlas, preserves alpha and dark outline/eye pixels, then bakes these visual axes into each token atlas:

- `body-highlight`
- `body`
- `body-shadow`
- `antenna`
- `mark`

This means body palettes and antenna colors are already exported as complete animated atlases while keeping Prime's real silhouette and animation timing. Random seeds that have not been exported yet fall back to runtime preview.

## Deferred Layer Traits

Geometry-changing traits cannot be faked with SVG or CSS. They need generated transparent layer atlases with the same frame contract as Prime:

```text
public/pets/prime-test/traits/
  antenna-shape/<trait-id>/state-atlas.png
  eye-style/<trait-id>/state-atlas.png
  forehead-mark/<trait-id>/state-atlas.png
  expression-set/<trait-id>/state-atlas.png
```

Each layer atlas must use:

- `192x208` cells
- `8` columns
- the same 12 state rows as the base atlas
- transparent pixels outside the trait
- no body silhouette drift

The final composer order should be:

```text
base Prime source layers
+ body palette recolor
+ antenna color recolor
+ generated eye layer
+ generated forehead mark layer
+ generated antenna shape layer
+ future clothes/accessories layers
= final token state-atlas.png
```

## Next Generation Step

Create artist-approved source layers for `antenna-shape`, `eye-style`, and `forehead-mark` instead of browser overlays. The generator should keep exporting finished token atlases; only its internal layer inputs should change.
