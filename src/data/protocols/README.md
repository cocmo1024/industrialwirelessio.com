# Protocol records (data layer)

One YAML record per protocol: `src/data/protocols/<slug>.yaml`.
Schema is defined and zod-validated in `src/content.config.ts`
(the `protocols` content collection); the build fails on a record
that does not conform.

Records are the single source for the protocol matrix (`/protocols/`),
the nameplate rails, the spectrum rail positioning, the link strips
and the comparison tables — pages are views of this data, never a
second copy of the numbers.

Sourcing rule (blueprint §4.4, GOAL hard rules): every numeric value
lives in `keyParameters` / `gatewayCapacity` / `payloadLimits` and
carries its primary source with it — a standards-body publication
(FieldComm Group, ISA/WCI, LoRa Alliance, IO-Link Community, IEC) or
a manufacturer datasheet with its document number. A value that
cannot be traced is omitted from the record entirely, never
approximated and never taken from a secondary compilation.

Phase 1 records: wirelesshart, isa100, io-link-wireless, lorawan.
The record `slug` is the page slug (`/protocols/<slug>/`); note the
ISA100 record lives at `isa100` while its product-vocabulary name
remains ISA100.11a.
