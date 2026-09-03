import { groupBy } from 'es-toolkit';
import { ExtractedAction } from '../../models/extracted-action';

type IndexedAction = { index: number; action: ExtractedAction };

export const renderActionsText = (actions: ExtractedAction[]): string => {
  const sorted = actions
    .map((action, index) => ({ index, action }))
    .sort(compareByHierarchy);

  return Object.entries(groupBy(sorted, (entry) => entry.action.axe))
    .map(([axe, axeEntries]) => renderAxe(axe, axeEntries))
    .join('\n');
};

const renderAxe = (axe: string, entries: IndexedAction[]): string => {
  const body = Object.entries(groupBy(entries, (entry) => entry.action.sousAxe))
    .map(([sousAxe, sousAxeEntries]) =>
      [`Sous axe ${sousAxe} :`, ...sousAxeEntries.map(renderActionLine)].join(
        '\n'
      )
    )
    .join('\n');
  return `${axe} :\n${body}`;
};

const renderActionLine = ({ index, action }: IndexedAction): string => {
  const champs = [
    `| ${index} | ${action.titre}`,
    action.description,
    action.sousActions.map((sousAction) => sousAction.titre).join('; ') || null,
    labelled('Objectifs', action.objectifs),
    labelled('Structure pilote', action.structurePilote),
    labelled('Direction ou service pilote', action.directionServicePilote),
    labelled('Personne pilote', action.personnePilote),
    labelled('Budget', action.budget === null ? null : String(action.budget)),
    labelled('Statut', action.statut),
  ].filter((champ): champ is string => champ !== null && champ.length > 0);
  return `${champs.join('; ')}.`;
};

const labelled = (label: string, value: string | null): string | null =>
  value && value.trim().length > 0 ? `${label} ${value.trim()}` : null;

const compareByHierarchy = (a: IndexedAction, b: IndexedAction): number =>
  a.action.axe.localeCompare(b.action.axe) ||
  a.action.sousAxe.localeCompare(b.action.sousAxe) ||
  a.index - b.index;
