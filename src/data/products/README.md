# Product records (data layer)

One YAML record per product: `src/data/products/<vendor>-<model>.yaml`.
Schema is fixed by blueprint v2 §4.2 and zod-validated in
`src/content.config.ts` (the `products` content collection); the
build fails on a record that does not conform.

Sourcing rule (blueprint §4.2, GOAL hard rules): every numeric/spec
field is either transcribed from the manufacturer primary source
named in the record (`sourceUrl` / `sourceType` / `sourceDocId` /
`dateChecked` — all four are part of the record) or null. Null fields
are never rendered: no placeholder, no "typical" value, no estimate.
Where two manufacturer documents disagree, the datasheet wins and the
discrepancy is written into the record's `notes`.

A record is not automatically a page. The §4.3 indexability gate
(`src/utils/products.ts`, `productGate`) decides — identity complete,
≥3 wireless-identity fields including protocols and bands, I/O
substance (or ≥2 upstream interfaces for gateways), source binding,
and enough sourced rows to fill the product anatomy. Records below
the gate stay as rows in the database index and protocol tables and
are promoted automatically when their sources are completed. Run
`node scripts/product-gate-report.mjs` for the per-record verdicts.

Phase 2 records: gateways/adapters (WirelessHART, ISA100, Wi-Fi),
wireless I/O modules, cellular routers/nodes, LoRaWAN gateways —
40 records approved by the user (2026-11-14).
