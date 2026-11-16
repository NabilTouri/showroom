# Baseline comparison

`compare.spec.ts` checks that the app builds the same car scene and renders the same frames as the
original app (commit `7885117`: plain JavaScript, before this refactor).

```bash
tests/baseline/prepare.sh            # worktree + build of 7885117 in ../showroom-baseline
npx playwright test -c tests/baseline/playwright.config.ts
```

- **Scene structure** — for every part: world bounding box, meshes (triangles, vertices, groups,
  world bounds, material fingerprint, shadows), explode vector and parent part; every openable's
  pivot, axis and angle; meshes that belong to no part. Part ids of the original app are translated
  with `id-map.ts`; the dumps must be equal.
- **Screenshots** — fixed states (initial view, selection, engine view, exploded engine, x-ray, all
  open, lights, paint, menus, vehicle card, mobile) of both apps at the same viewport. The
  isolated-part preview is masked (it auto-rotates once per frame). Results, diff images and
  `summary.jsonl` are written to `test-results/baseline/`.

`prepare.sh` patches the baseline's grain textures to use the same seeded generator as the current
app (the original used `Math.random()`), so both apps produce identical textures.

The original app has no i18n: the current app is opened in Italian (`showroom.language`).
Set `PW_CHROMIUM_PATH` to use a pre-installed Chromium.
