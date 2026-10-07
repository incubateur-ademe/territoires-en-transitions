import { useGetAiImportStatus } from './use-get-ai-import-status';
import { useGetCurrentAiImport } from './use-get-current-ai-import';

/**
 * Import en cours de la collectivité, suivi jusqu'à son terme même quand aucun
 * formulaire d'import n'est affiché (modale fermée).
 */
export const useGetOngoingAiImport = (
  collectiviteId: number,
  { enabled = true }: { enabled?: boolean } = {}
) => {
  const { data: currentImport, isFetchedAfterMount } = useGetCurrentAiImport(
    collectiviteId,
    { enabled }
  );
  // Le cache peut encore tenir un import terminé depuis : seule la réponse
  // fraîche compte, sinon sa fin serait traitée une seconde fois.
  const jobId = isFetchedAfterMount ? currentImport?.jobId ?? null : null;
  const { data: status } = useGetAiImportStatus(jobId);
  const isOngoing =
    jobId !== null && status?.status !== 'done' && status?.status !== 'failed';

  return { jobId, status, isOngoing };
};
