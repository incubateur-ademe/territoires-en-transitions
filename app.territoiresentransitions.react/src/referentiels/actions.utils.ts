import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { ReferentielId } from '@/domain/referentiels';

export const parentId = (actionId: string): string | null => {
  const elements = actionId.split('.');
  if (elements.length === 1) return null;
  elements.pop();
  return elements.join('.');
};

// TODO-REFERENTIEL: replace with `getReferentielIdFromActionId`
export const referentielId = (
  actionId: string
): Exclude<ReferentielId, 'te' | 'te-test'> =>
  actionId.startsWith('eci') ? 'eci' : 'cae';

export const referentielDisplayName = (
  action: ActionDefinitionSummary
): string =>
  action.referentiel === 'cae' ? 'Climat Air Energie' : 'Économie Circulaire';
