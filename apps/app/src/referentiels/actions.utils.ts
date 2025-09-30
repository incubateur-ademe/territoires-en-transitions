import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';

export const parentId = (actionId: string): string | null => {
  const elements = actionId.split('.');
  if (elements.length === 1) return null;
  elements.pop();
  return elements.join('.');
};

export const referentielDisplayName = (
  action: ActionDefinitionSummary
): string =>
  action.referentiel === 'cae' ? 'Climat Air Énergie' : 'Économie Circulaire';
