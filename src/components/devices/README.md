# Device Components

Each file in this folder is a self-contained 3D device you can drop into a scene.
The `/3d-test` page renders whichever device you import at the top of
`src/app/3d-test/page.tsx`.

## Swap the active device

Edit `src/app/3d-test/page.tsx`, change the import line:

```tsx
// Use Steam Deck
import { Model as ActiveDevice } from '@/components/devices/SteamDeck';
import { type SteamDeckControlEvent as DeviceControlEvent } from '@/components/devices/SteamDeck';

// Or switch to a Computer (once you create Computer.tsx):
// import { Model as ActiveDevice } from '@/components/devices/Computer';
// import { type ComputerControlEvent as DeviceControlEvent } from '@/components/devices/Computer';
```

That's the entire swap. Everything else on the page (camera, lighting,
orbit controls, probe panel) stays the same.

## Add a new device

1. Drop the `.glb` file in `public/models/` (e.g. `public/models/computer.glb`)
2. Generate typed wrapper:
   ```bash
   npx gltfjsx@latest public/models/computer.glb -o src/components/devices/Computer.tsx -t
   ```
3. Open `Computer.tsx`, rename the exported types and functions:
   - `type GLTFResult` stays as-is (internal)
   - Add an exported `Control` union type and `ControlEvent` interface
     (copy from SteamDeck.tsx as a template)
   - Rename `Model` if you want — or keep it and import as `Model as ActiveDevice`
4. Add interaction helpers (ClickZone, RealStick, PressableMesh, FaceButton etc.)
   — copy from SteamDeck.tsx as needed
5. Swap the import in `/3d-test/page.tsx`

## Model files

Raw device models live in `public/models/`:

- `steam_deck.glb` — split version (joystick stem/base separated)
- `steam_deck_original.glb` — pre-split backup (reference only)
- `steam_deck_sketchfab.glb` — original Sketchfab download
