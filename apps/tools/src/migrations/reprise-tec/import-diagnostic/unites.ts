/** Les unités : T&C faisait saisir les émissions de GES et la séquestration en tonnes, la grille de TeT les attend en kilotonnes. */

import type { Dossiers } from './dossiers';
import type { Ecart } from './ecarts';
import type { TableDiagnostic, Valeur } from './tables-grille';

type Bornes = { min: number; max: number };

/** Ordre de grandeur vraisemblable, en tonnes par habitant et par an. */
const BORNES: Partial<Record<TableDiagnostic, Bornes>> = {
  demarche_emission_ges: { min: 0.5, max: 40 },
  demarche_sequestration_estimation: { min: 0.01, max: 40 },
};

/** Distance, en ordres de grandeur, entre une valeur par habitant et les bornes ; 0 dedans. */
const distance = (parHabitant: number, { min, max }: Bornes) =>
  parHabitant < min
    ? Math.log10(min / parHabitant)
    : parHabitant > max
    ? Math.log10(parHabitant / max)
    : 0;

/** Règle : l'unité, kilotonnes ou tonnes, qui donne par habitant l'ordre de grandeur le plus vraisemblable ; `null` sans population ou sans valeur. */
export const choisirUnite = (
  total: number,
  population: number | null,
  bornes: Bornes
): 'kilotonnes' | 'tonnes' | null => {
  if (!population || total === 0) {
    return null;
  }
  const siKilotonnes = (Math.abs(total) * 1000) / population;
  return distance(siKilotonnes / 1000, bornes) < distance(siKilotonnes, bornes)
    ? 'tonnes'
    : 'kilotonnes';
};

/**
 * Règle : par dossier et par table, l'unité se lit sur le constat le plus récent (période 1) ;
 * en tonnes, toutes les valeurs de la table pour ce dossier sont divisées par 1 000.
 * Un écart trace chaque dossier converti (`unite_convertie`) ou indécidable (`unite_indeterminee`).
 */
export const convertirUnites = (
  valeurs: readonly Valeur[],
  dossiers: Dossiers
) => {
  const unites = new Map<string, 'kilotonnes' | 'tonnes' | null>();
  const ecarts: Ecart[] = [];
  for (const [table, bornes] of Object.entries(BORNES) as [
    TableDiagnostic,
    Bornes
  ][]) {
    const parDossier = new Map<number, Valeur[]>();
    for (const v of valeurs.filter((v) => v.ligne.table === table)) {
      parDossier.set(v.dossier, [...(parDossier.get(v.dossier) ?? []), v]);
    }
    for (const [dossier, valeursDuDossier] of parDossier) {
      const unite = choisirUnite(
        totalDuConstat(valeursDuDossier),
        dossiers.get(dossier).population,
        bornes
      );
      unites.set(`${table}|${dossier}`, unite);
      if (unite !== 'kilotonnes') {
        ecarts.push({
          table,
          id: dossier,
          precision: 'unite',
          motif: unite === 'tonnes' ? 'unite_convertie' : 'unite_indeterminee',
        });
      }
    }
  }
  return {
    valeurs: valeurs.map((v) =>
      unites.get(`${v.ligne.table}|${v.dossier}`) === 'tonnes'
        ? { ...v, valeur: v.valeur / 1000 }
        : v
    ),
    ecarts,
  };
};

/** La somme, en valeur absolue, des valeurs de la période 1 de l'année la plus récente. */
const totalDuConstat = (valeurs: readonly Valeur[]) => {
  const constat = valeurs.filter((v) => v.ligne.periode === 1);
  const annee = Math.max(...constat.map((v) => v.ligne.annee ?? -Infinity));
  return constat
    .filter((v) => (v.ligne.annee ?? -Infinity) === annee)
    .reduce((somme, v) => somme + Math.abs(v.valeur), 0);
};
