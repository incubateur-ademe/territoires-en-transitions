import {
  generateCellKey,
  toIndicateurId,
  toYear,
  type CellKey,
  type GridCell,
  type GridInput,
  type GridRow,
} from '../../../../indicateurs/valeurs/grid/types';
import type { DemarchePcaetTopic } from '@tet/domain/demarches';

type TopicPayload = Pick<
  DemarchePcaetTopic,
  'rows' | 'years' | 'valeurs'
>;

const toGridRow = (row: {
  label: string;
  indicateurId: number | null;
}): GridRow[] =>
  row.indicateurId === null
    ? []
    : [{ indicateurId: toIndicateurId(row.indicateurId), label: row.label }];

/**
 * Lignes de la grille. Un topic dont aucune ligne ne se décompose se rend à
 * plat : les secteurs du décret n'ont pas de niveau intermédiaire à afficher.
 */
export const toGridInput = (topic: TopicPayload): GridInput => {
  const isFlat = topic.rows.every((row) => row.rows.length === 0);
  if (isFlat) {
    return topic.rows.flatMap(toGridRow);
  }

  return Object.fromEntries(
    topic.rows.map((row) => [
      row.label,
      { label: row.label, rows: [...toGridRow(row), ...row.rows.flatMap(toGridRow)] },
    ])
  );
};

/**
 * Cellules de la grille. Le serveur sert déjà une valeur par croisement ligne ×
 * année affichée, y compris vide : quelles cellules sont ouvertes à la saisie
 * est sa décision, pas celle de la grille.
 *
 * `getSourceLabel` résout l'identifiant de source en libellé affichable : la
 * grille ne connaît pas le registre des sources d'indicateurs.
 */
export const toGridCells = (
  topic: TopicPayload,
  getSourceLabel: (sourceId: string) => string
): Map<CellKey, GridCell> =>
  new Map<CellKey, GridCell>(
    topic.valeurs.map((valeur): [CellKey, GridCell] => [
      generateCellKey(toIndicateurId(valeur.indicateurId), toYear(valeur.year)),
      {
        resultat: valeur.resultat,
        objectif: valeur.objectif,
        references: valeur.references.map((reference) => ({
          label: getSourceLabel(reference.sourceId),
          millesime: reference.millesime,
          resultat: reference.resultat,
        })),
      },
    ])
  );
