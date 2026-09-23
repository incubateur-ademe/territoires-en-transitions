/** Le suivi ADEME : l'obligation et l'approbation de chaque collectivité, par SIREN. */

import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';

export type LigneSuivi = {
  obligation: string;
  approbation: string | null;
};

export type SuiviAdeme = ReturnType<typeof readSuiviAdeme>;

/** Lit le suivi ADEME (CSV). */
export const readSuiviAdeme = (chemin: string) => {
  const lignes = parse(readFileSync(chemin, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  }) as { siren: string; obligation: string; date_approbation: string }[];

  const parSiren = new Map<string, typeof lignes>();
  for (const l of lignes) {
    const siren = l.siren.padStart(9, '0');
    parSiren.set(siren, [...(parSiren.get(siren) ?? []), l]);
  }

  const suivi = new Map<string, LigneSuivi>(
    [...parSiren]
      .filter(([, memeSiren]) => memeSiren.length === 1)
      .map(([siren, [l]]) => [
        siren,
        { obligation: l.obligation, approbation: l.date_approbation || null },
      ])
  );

  return {
    /** La ligne du suivi pour ce SIREN ; `undefined` s'il est absent ou présent deux fois. */
    getLigne: (siren: string | null | undefined) =>
      siren ? suivi.get(siren) : undefined,
  };
};
