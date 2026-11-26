import { appLabels } from '@/app/labels/catalog';
import type { ImportAbandon } from '@/app/plans/plans/import-plan/ai-import-abandon.alert';
import { importAbandonProblemLabels } from '@/app/plans/plans/import-plan/ai-import.labels';

/**
 * Un abandon motivé, modale fermée : le problème en une phrase, et le chemin
 * vers le compte rendu qui donne les passages, leurs pages et quoi faire.
 */
export const makeAbandonToast = (
  { motif }: Pick<ImportAbandon, 'motif'>,
  onShowReport: () => void
) => ({
  status: 'info' as const,
  message: `${appLabels.importPlanIaAbandonTitre}. ${importAbandonProblemLabels[motif]}`,
  action: {
    label: appLabels.importPlanIaAbandonVoirPourquoi,
    onClick: onShowReport,
  },
});
