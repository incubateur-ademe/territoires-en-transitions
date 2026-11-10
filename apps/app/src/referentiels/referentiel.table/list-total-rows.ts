import { Row } from '@tanstack/react-table';
import { StatutAvancementEnum } from '@tet/domain/referentiels';
import { ActionListItem } from '../actions/use-list-actions';
import { ReferentielTableFeatures } from './utils';

type TableRow = Row<ReferentielTableFeatures, ActionListItem>;

/** Vrai si la ligne passe elle-même tous les filtres (recherche comprise). */
function matchesFiltersItself(row: TableRow): boolean {
  return Object.values(row.columnFilters ?? {}).every(Boolean);
}

/**
 * Vrai si le score de la ligne est la somme de ceux de ses enfants. Un statut
 * propre ou un « non concerné » prévaut sur les enfants : le score de ces
 * derniers ne compte alors pas (cf. `ScoresService`).
 */
function isScoreFromChildren(row: TableRow): boolean {
  const { avancement, concerne } = row.original.score;
  return (
    concerne !== false &&
    (!avancement || avancement === StatutAvancementEnum.NON_RENSEIGNE)
  );
}

/**
 * Lignes affichées à sommer pour le total, sans double comptage.
 *
 * Avec `filterFromLeafRows`, un parent reste affiché dès qu'un de ses
 * descendants est retenu, mais son score agrège toute sa descendance. On prend
 * donc le score d'une ligne si elle passe elle-même les filtres, ou si aucun de
 * ses enfants n'est affiché (ligne repliée, tâches masquées) : le total
 * correspond alors à ce que l'on voit. On la prend aussi en entier si son score
 * ne vient pas de ses enfants (statut propre, non concerné). Sinon on descend
 * dans ses enfants affichés.
 */
export function listTotalRows(displayedRows: TableRow[]): TableRow[] {
  const displayedIds = new Set(displayedRows.map((row) => row.id));

  const collect = (row: TableRow): TableRow[] => {
    const displayedChildren = row.subRows.filter((child) =>
      displayedIds.has(child.id)
    );
    return matchesFiltersItself(row) ||
      !isScoreFromChildren(row) ||
      displayedChildren.length === 0
      ? [row]
      : displayedChildren.flatMap(collect);
  };

  return displayedRows.filter((row) => row.depth === 0).flatMap(collect);
}
