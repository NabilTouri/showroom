# Showroom — 3D vehicle explorer

A web app that shows a car in 3D, part by part. The first vehicle is a Renault Clio IV (2016)
1.5 dCi 75 hp diesel (K9K 612/628 engine).

- Orbit, zoom and pan the view (mouse or touch).
- Open and close hood, doors and tailgate (double-click the panel, the **Openings** menu or
  **Open all**).
- Click a part (or pick it from the list) to see it isolated next to its card: what it does, where
  it is, technical data, maintenance, typical faults and OEM part numbers.
- Showroom rendering: dark studio with reflections, glossy floor, soft shadows, metallic paints
  (**Colour** menu), switchable lights (**Lights** menu) and three **Quality** levels (High,
  Medium, Low; chosen automatically, or forced with `?q=high|medium|low`).
- **X-ray** makes the body see-through, **Explode engine** spreads out the engine bay, **Hide**
  removes a part to see what is behind it.
- English and Italian interface (**EN / IT** switch, the choice is remembered).

## Getting started

```bash
npm install
npm run dev        # development server, http://localhost:5173
npm run build      # static site in dist/
npm run preview    # serves dist/
```

## Checks

```bash
npm run typecheck  # TypeScript (strict)
npm run lint       # ESLint
npm run format     # Prettier
npm test           # unit tests (Vitest)
npm run test:e2e   # browser tests (Playwright, Chromium)
```

The browser tests need WebGL: on machines without a GPU they use SwiftShader. Install the browser
once with `npx playwright install --with-deps chromium`, or point `PW_CHROMIUM_PATH` to an
installed Chromium. `tests/baseline/` compares the app with the original JavaScript version
(commit `7885117`): see its README.

## Structure

- `src/viewer/` — the generic 3D viewer. `Viewer` (explicit `load()` / `dispose()`) owns renderer,
  studio, post-processing and quality, and handles picking, highlight, x-ray, exploded view,
  openables, camera flights, paint, lights and the isolated-part preview. The UI drives it through
  its methods and observes `viewer.store` (state) and `viewer.events` (hover).
  `gltf-assembly.ts` turns a glTF model into parts from a declarative spec; `shapes.ts` and
  `textures.ts` help vehicles build procedural parts.
- `src/vehicles/` — `types.ts` is the `VehicleDefinition` contract, `registry.ts` lists the
  vehicles, `part-cards.ts` resolves part ids to cards. Each vehicle lives in its own folder:
  `renault-clio-4/` holds the manifest (`index.ts`, checked with `satisfies VehicleDefinition`),
  the glTF spec and model, the procedural K9K engine bay, wheels, hidden parts, materials,
  language-independent card data (`cards.ts`) and texts per language (`locales/*.json`).
- `src/ui/` — React interface (top bar, part list, panel, tooltip).
- `src/i18n/` — i18next setup and UI texts per language.
- `tools/` — `inspect-glb.mjs` (nodes, meshes, materials of a GLB) and `islands.mjs` (triangle
  islands of a mesh, used to write detail rules).
- `tests/` — Playwright end-to-end tests and the baseline comparison.

### Part ids

Part ids are English, dotted and hierarchical, with position and side as trailing segments:
`hood`, `door.front.left`, `wheel.rear.right`, `headlight.left`, `turbocharger`. A part without a
card of its own uses its base card plus the qualifiers: `wheel.front.left` → card `wheel`
("Wheel and tire (front left)").

### Adding a vehicle

Create `src/vehicles/<id>/` with a manifest that `satisfies VehicleDefinition` (build function,
views, openables, paints, lights, categories, cards and `locales/en.json` + `it.json`) and add it
to `src/vehicles/registry.ts`. Nothing in `src/viewer` or `src/ui` is vehicle-specific.

## Notes

The body is the model «Renault Clio MK4 2012-2020» by Merc_TV (CC BY 4.0, see `CREDITS.md`).
Engine bay and mechanicals are simplified reconstructions built in code. Technical data,
maintenance intervals and above all OEM part numbers are indicative: the ones marked "to be
verified" must be checked against the VIN.
