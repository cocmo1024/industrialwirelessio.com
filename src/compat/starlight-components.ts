/**
 * TEMPORARY compatibility shim (Phase 0–3 of the rebuild).
 *
 * Legacy MDX bodies import { LinkCard, Card, CardGrid, Steps } from
 * '@astrojs/starlight/components'. Starlight is removed from this
 * stack, but the content loader still has to resolve those imports to
 * compile the files. Page bodies are NOT rendered by the new routes
 * in Phase 0, so these stubs are never invoked; they exist only so
 * the build can resolve the module.
 *
 * Phase 4 migration replaces every Starlight component usage in the
 * content with native components and deletes this shim + the alias in
 * astro.config.mjs. Do not build anything new on top of it.
 */
export const LinkCard = () => null;
export const Card = () => null;
export const CardGrid = () => null;
export const Steps = () => null;
