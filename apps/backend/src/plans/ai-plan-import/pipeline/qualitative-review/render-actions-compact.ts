import { estimateTokenCount } from '@tet/backend/utils/llm/estimate-token-count';
import { isNotNil } from 'es-toolkit';
import {
  ExtractedAction,
  ExtractedSousAction,
} from '../../models/extracted-action';

// La relecture porte un jugement d'ensemble : un échantillon suffit, et
// l'entrée doit tenir dans la fenêtre du modèle avec sa réponse.
export const DEFAULT_REVIEW_MAX_TOKENS = 30_000;

export const renderActionsCompact = (
  actions: ExtractedAction[],
  { maxTokens = DEFAULT_REVIEW_MAX_TOKENS }: { maxTokens?: number } = {}
): string => {
  const lines: string[] = [];
  let tokens = 0;
  for (const [index, action] of actions.entries()) {
    const rendered = renderAction(action);
    tokens += estimateTokenCount(rendered) + 1;
    if (tokens > maxTokens && lines.length > 0) {
      lines.push(`… et ${actions.length - index} autres actions non listées.`);
      break;
    }
    lines.push(rendered);
  }
  return lines.join('\n');
};

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
    labelled('Partenaires', action.partenaires),
    labelled('Budget', action.budget === null ? null : String(action.budget)),
    labelled('Financements', action.financements),
    labelled('Moyens humains', action.moyensHumains),
    labelled('Priorité', action.priorite),
    labelled('Date de début', action.dateDebut),
    labelled('Date de fin', action.dateFin),
    labelled('Statut', action.statut),
  ]
    .filter(isNotNil)
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
    .filter(isNotNil)
    .join(' | ');

const labelled = (label: string, value: string | null): string | null =>
  value && value.trim().length > 0 ? `${label} : ${value.trim()}` : null;
