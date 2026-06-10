import {
  ExtractedAction,
  ExtractedSousAction,
} from '../../models/extracted-action';

export const renderActionsCompact = (actions: ExtractedAction[]): string =>
  actions.map(renderAction).join('\n');

const renderAction = (action: ExtractedAction): string =>
  [
    renderActionLine(action),
    ...action.sousActions.map(renderSousActionLine),
  ].join('\n');

const renderActionLine = (action: ExtractedAction): string =>
  [
    action.titre,
    labelled('Axe', action.axe),
    labelled('Sous-axe', action.sousAxe),
    labelled('Description', action.description),
    labelled('Objectifs', action.objectifs),
    labelled('Structure pilote', action.structurePilote),
    labelled('Direction ou service pilote', action.directionServicePilote),
    labelled('Personne pilote', action.personnePilote),
    labelled('Budget', action.budget === null ? null : String(action.budget)),
    labelled('Statut', action.statut),
  ]
    .filter(isPresent)
    .join(' | ');

const renderSousActionLine = (sousAction: ExtractedSousAction): string =>
  [
    `[SA] ${sousAction.titre}`,
    labelled('Description', sousAction.description),
    labelled('Personne pilote', sousAction.personnePilote),
    labelled('Statut', sousAction.statut),
    labelled('Date de début', sousAction.dateDebut),
    labelled('Date de fin', sousAction.dateFin),
  ]
    .filter(isPresent)
    .join(' | ');

const labelled = (label: string, value: string | null): string | null =>
  value && value.trim().length > 0 ? `${label} : ${value.trim()}` : null;

const isPresent = (champ: string | null): champ is string =>
  champ !== null && champ.length > 0;
