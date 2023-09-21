import {
  assertExists,
  assertInstanceOf,
  assertAlmostEquals,
} from 'https://deno.land/std@0.198.0/assert/mod.ts';

/**
 *  Vérifie qu'on a des données et que la taille est celle attendue +/- 1ko
 */
export const assertIsBlobWithExpectedSize = (
  blob: Blob,
  expectedSize: number,
  tolerance = 1024
) => {
  assertExists(blob);
  assertInstanceOf(blob, Blob);
  assertAlmostEquals(blob.size, expectedSize, tolerance);
};
