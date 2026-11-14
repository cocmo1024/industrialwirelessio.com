# Product records (data layer)

One YAML record per product: `src/data/products/<vendor>-<model>.yaml`.
Schema is fixed by blueprint v2 §4.2 and lands with the first
records in Phase 2. Every numeric/spec field is either transcribed
from a manufacturer primary source (recorded in the record's source
fields) or null — null fields are never rendered.
