import { Row } from '@tanstack/react-table';
import {
  ActionTypeEnum,
  getParentId,
  StatutAvancement,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { ActionListItem } from '../actions/use-list-actions';

/** Supprime les balises HTML d'un texte riche */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Walks up the action ID hierarchy to find the nearest ancestor of the
 * given type. Uses the data record instead of `row.getParentRow()` which
 * is unsafe during the filtering phase (row model not yet built).
 */
function findNearestActionOfType(
  actionId: string,
  actionType: string,
  actions: Record<string, ActionListItem>
): ActionListItem | undefined {
  let currentId: string | null = actionId;
  while (currentId) {
    const action = actions[currentId];
    if (action?.actionType === actionType) return action;
    currentId = getParentId({ actionId: currentId });
  }
  return undefined;
}

export function getTextFilterFn(
  row: Row<ActionListItem>,
  _columnId: string,
  filterValue: string
) {
  const searchLower = filterValue.toLowerCase();
  const nomMatch = row.original.nom?.toLowerCase().includes(searchLower);
  const identifiantMatch = row.original.identifiant
    ?.toLowerCase()
    .startsWith(searchLower);
  const explicationMatch = row.original.score?.explication
    ? stripHtml(row.original.score.explication)
        .toLowerCase()
        .includes(searchLower)
    : false;
  return !!nomMatch || !!identifiantMatch || explicationMatch;
}

export function getStatutFilterFn(
  row: Row<ActionListItem>,
  columnId: string,
  filterValue: string[]
) {
  const statut = row.getValue<StatutAvancement | null | undefined>(columnId);
  if (statut === undefined) return false;
  return filterValue.includes(statut ?? StatutAvancementEnum.NON_RENSEIGNE);
}

export function getPilotesFilterFn(
  actions: Record<string, ActionListItem>
) {
  return (row: Row<ActionListItem>, _columnId: string, filterValue: string[]) => {
    const actionData = findNearestActionOfType(
      row.original.actionId,
      ActionTypeEnum.ACTION,
      actions
    );
    if (!actionData) return false;

    return actionData.pilotes.some((p) =>
      p.tagId
        ? filterValue.includes(String(p.tagId))
        : p.userId
        ? filterValue.includes(p.userId)
        : false
    );
  };
}

export function getServicesFilterFn(
  actions: Record<string, ActionListItem>
) {
  return (row: Row<ActionListItem>, _columnId: string, filterValue: number[]) => {
    const actionData = findNearestActionOfType(
      row.original.actionId,
      ActionTypeEnum.ACTION,
      actions
    );
    if (!actionData) return false;

    const serviceIds = actionData.services?.map((s) => s.id) ?? [];
    return filterValue.some((id) => serviceIds.includes(id));
  };
}
