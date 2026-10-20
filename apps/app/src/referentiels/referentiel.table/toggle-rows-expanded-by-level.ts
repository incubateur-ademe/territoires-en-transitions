import { ExpandedState } from '@tanstack/react-table';

/** Ligne dépliable de l'arborescence affichée par la table */
export type ExpandableRow = {
  id: string;
  /** profondeur dans la table (0 pour les lignes de 1er niveau) */
  depth: number;
  /** id de la ligne de 1er niveau (axe) à laquelle appartient la ligne */
  axeId: string;
};

/**
 * Liste les lignes dépliables en parcourant l'arborescence depuis les lignes
 * de 1er niveau, pour que profondeur et axe correspondent à ce qui est affiché
 * (ex : axes synthétiques de la vue SGPE).
 */
export function listExpandableRows<TRow>({
  roots,
  getId,
  getChildren,
  canExpand,
}: {
  roots: readonly TRow[];
  getId: (row: TRow) => string;
  getChildren: (row: TRow) => readonly TRow[];
  canExpand: (row: TRow) => boolean;
}): ExpandableRow[] {
  const result: ExpandableRow[] = [];

  const visit = (row: TRow, depth: number, axeId: string) => {
    if (!canExpand(row)) return;
    result.push({ id: getId(row), depth, axeId });
    getChildren(row).forEach((child) => visit(child, depth + 1, axeId));
  };

  roots.forEach((root) => visit(root, 0, getId(root)));
  return result;
}

export type ExpandScope = 'axe' | 'all';

/**
 * Calcule le nouvel état plié/déplié lors d'un clic avec une touche
 * modificatrice sur une ligne :
 * - si la ligne est repliée, déplie toutes les lignes de niveau inférieur ou
 *   égal (de l'axe de la ligne cliquée, ou de tous les axes) et replie les
 *   lignes plus profondes ;
 * - si la ligne est dépliée, replie toutes les lignes de même niveau ou plus
 *   profondes, dans tous les axes.
 */
export function getExpandedStateByLevel({
  rows,
  expanded,
  clickedId,
  scope,
}: {
  rows: ExpandableRow[];
  expanded: ExpandedState;
  clickedId: string;
  scope: ExpandScope;
}): Record<string, boolean> {
  const current: Record<string, boolean> =
    expanded === true
      ? Object.fromEntries(rows.map(({ id }) => [id, true]))
      : expanded;

  const clicked = rows.find(({ id }) => id === clickedId);
  if (!clicked) return current;

  const next = { ...current };

  if (!current[clickedId]) {
    rows
      .filter(({ axeId }) => scope === 'all' || axeId === clicked.axeId)
      .forEach(({ id, depth }) => {
        if (depth <= clicked.depth) {
          next[id] = true;
        } else {
          delete next[id];
        }
      });
    return next;
  }

  rows
    .filter(({ depth }) => depth >= clicked.depth)
    .forEach(({ id }) => delete next[id]);
  return next;
}
