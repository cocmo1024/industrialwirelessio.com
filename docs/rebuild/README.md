# Rebuild (blueprint v2, approved 2026-11-14)

This branch rebuilds industrialwirelessio.com from a Starlight
documentation template into a data-driven wireless-connectivity hub:
Astro custom (no Starlight, no Tailwind), protocol graph as the
information architecture, product/protocol spec records as the core,
link-engineering tools embedded in the reading flow, and 7-locale
i18n generated from translation manifests only.

Governing documents:

- Blueprint v2: `~/workspace/goals/industrialwirelessio-com-i-o/hidden_files/rebuild-blueprint-v2-2026-11-14.md`
- Industrial UI Construction Standard v1.2: `~/workspace/industrial-ui-standard/standard-v1.md`
- GEO construction lists (assets / entity / question bank): goal `hidden_files/geo-construction-lists-2026-11-13.md`

## Starlight removal / replacement (executed in this branch, Phase 0)

The branch was created from `main` @ af641f5, so legacy files are
still present in the tree until the phases that retire them. The
replacement is already effective for everything the new build uses:

| Legacy piece | Replacement |
|---|---|
| `@astrojs/starlight` integration + sidebar doc tree | Custom routing: `src/pages/[...slug].astro` generated from the route manifest (`src/utils/routes.ts`); three-axis navigation in `src/components/Header.astro` |
| Starlight i18n + fallback rendering | Manifest-driven routes: only (page, locale) pairs that exist on disk are generated — no fallback copies (blueprint §5.1) |
| `@astrojs/starlight/loaders` docs collection | `pages` collection, glob loader over `src/content/pages/<locale>/` (`src/content.config.ts`) |
| `src/utils/site-meta.mjs` | `src/data/brand.ts` — single source of truth for brand facts (GEO List B-13), with List B fixes B-01/02/03/04/05 applied |
| `src/utils/seo.mjs` | `src/utils/seo.ts` — ported; same Organization @id, B-fixed sameAs/description/knowsAbout |
| Tailwind 4 + Starlight theme CSS | Design tokens from the Industrial UI Standard scaffold (`src/styles/tokens.css`, light theme only — recorded adaptation) + native CSS (`src/styles/global.css`) |
| Hand-written `public/llms.txt` | Build-generated endpoint `src/pages/llms.txt.ts` (the static file is deleted on this branch) |
| `src/pages/llms-full.txt.ts` (docs collection) | Ported to the `pages` collection; output contract unchanged |
| Starlight Pagefind wiring | `pagefind` postbuild step + `src/pages/search.astro` |
| Legacy content in `src/content/docs/` | Migrated copy lives in `src/content/pages/en/`; the legacy directory is retired at the Phase 4 cutover |

Legacy files that remain physically present on this branch
(`src/content/docs/`, old components/styles, `wrangler.jsonc`) are
inert: the new `astro.config.mjs`, `package.json` and
`src/content.config.ts` never reference them. They are removed in
the Phase 4 cutover commit, when the old stack leaves the repository
for good (git history keeps the rollback path).

## Phase map

0. Foundation — this scaffold (branch, tokens, brand/seo single
   source, channel plumbing, checker baseline, report skeletons).
1. Data layer skeleton + protocol hub + first protocol pages.
2. Product database v1 (40 records).
3. Tools v1 (link budget + Fresnel).
4. Stock migration + one-shot cutover to `main`.
5. i18n ML-1 (German hub set).

The production site (`main`) is untouched until the Phase 4 cutover.
