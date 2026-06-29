import type { ReferentielMode } from './collectivite-preferences.schema';

export function canMutateReferentielData(mode: ReferentielMode): boolean {
  return mode === 'write';
}
