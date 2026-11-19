# Vendor records (data layer)

One YAML record per maker: `src/data/vendors/<vendor-slug>.yaml`.
Schema in `src/content.config.ts` (the `vendors` collection);
product records join to a vendor through their `vendorSlug` field.

Fields follow blueprint R1.6 (the commercial skeleton — structure
only, no workflow is promised or implied):

- `listingStatus`: `listed` = recorded by the editors, unclaimed.
  `claimed` / `verified` are set only when an actual claim or
  verification event happens; `claimSource` holds the internal note
  and is never rendered. Every record starts as `listed`.
- `featuredEligible`: eligibility flag for a future Featured slot;
  nothing renders differently while it is set.
- `founded` / `headquarters`: present **only** when transcribed from
  the maker's own official pages (with the page in `sources`); the
  fields are omitted, never approximated, when unresearched.
- `productLines`: the maker's own line names, limited to the lines
  this database actually covers.

Vendor directory and vendor pages are portal-layer surfaces; these
records exist ahead of them so product data joins cleanly from day
one.
