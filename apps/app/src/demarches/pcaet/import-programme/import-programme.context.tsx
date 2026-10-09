'use client';

import { useDemarcheId } from '@/app/demarches/use-demarche-id';
import { appLabels } from '@/app/labels/catalog';
import { useGetOngoingAiImport } from '@/app/plans/plans/import-plan/data/use-get-ongoing-ai-import';
import { useIsAiPlanImportEnabled } from '@/app/plans/plans/import-plan/use-is-ai-plan-import-enabled';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type ImportProgrammeContextValue = {
  isEnabled: boolean;
  isOngoing: boolean;
  /**
   * À appeler dès l'import lancé depuis la démarche : le plan, créé au
   * lancement, y est rattaché d'office, et la fin de l'import est suivie.
   */
  trackImport: (jobId: string, planId: number) => void;
  /** Le suivi de l'import est affiché : son échec s'y lit déjà. */
  setIsProgressDisplayed: (isDisplayed: boolean) => void;
};

const ImportProgrammeContext =
  createContext<ImportProgrammeContextValue | null>(null);

export const useImportProgramme = () => {
  const context = useContext(ImportProgrammeContext);
  if (!context) {
    throw new Error(
      'useImportProgramme must be used within an ImportProgrammeProvider'
    );
  }
  return context;
};

/**
 * Suivi de l'import du programme d'actions, au niveau de la démarche et non
 * d'une page : lancé depuis l'étape Documents, il se termine souvent pendant
 * que la collectivité est ailleurs dans la démarche.
 */
export const ImportProgrammeProvider = ({ children }: PropsWithChildren) => {
  const collectiviteId = useCollectiviteId();
  const demarcheId = useDemarcheId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setToast } = useToastContext();
  const isEnabled = useIsAiPlanImportEnabled();

  const {
    jobId: ongoingJobId,
    status: ongoingStatus,
    isOngoing,
  } = useGetOngoingAiImport(collectiviteId, { enabled: isEnabled });

  const [startedJobId, setStartedJobId] = useState<string | null>(null);
  const handledJobId = useRef<string | null>(null);
  const isProgressDisplayed = useRef(false);

  const { mutateAsync: updateDemarche } = useMutation(
    trpc.demarches.pcaet.update.mutationOptions()
  );

  // Même règle que la création : seul le premier plan est rattaché d'office.
  // La démarche est relue du serveur, le cache de la page pouvant dater.
  const linkIfFirstPlan = useCallback(
    async (planId: number) => {
      const demarcheQuery = trpc.demarches.pcaet.get.queryOptions({
        collectiviteId,
        demarcheId,
      });
      const demarche = await queryClient.fetchQuery(demarcheQuery);
      if (!demarche.amontModifiable || demarche.planActionIds.length > 0) {
        return;
      }
      const updated = await updateDemarche({
        collectiviteId,
        demarcheId,
        planActionIds: [planId],
      });
      queryClient.setQueryData(demarcheQuery.queryKey, updated);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: trpc.demarches.pcaet.list.queryKey({ collectiviteId }),
        }),
        queryClient.invalidateQueries({
          queryKey: trpc.demarches.listPlanLinks.queryKey({ collectiviteId }),
        }),
      ]);
    },
    [collectiviteId, demarcheId, queryClient, trpc, updateDemarche]
  );

  useEffect(() => {
    if (ongoingJobId === null || handledJobId.current === ongoingJobId) {
      return;
    }
    // Le suivi est à la maille de la collectivité : un import lancé par
    // quelqu'un d'autre rafraîchit la liste mais ne toaste pas ici.
    const startedHere = ongoingJobId === startedJobId;
    if (
      ongoingStatus?.status === 'done' &&
      ongoingStatus.createdPlanId !== null
    ) {
      handledJobId.current = ongoingJobId;
      queryClient.invalidateQueries({
        queryKey: trpc.plans.plans.list.queryKey({ collectiviteId }),
      });
      if (startedHere) {
        setToast('success', appLabels.demarcheProgrammeImportTermine);
      }
    } else if (ongoingStatus?.status === 'failed') {
      handledJobId.current = ongoingJobId;
      queryClient.invalidateQueries({
        queryKey: trpc.plans.plans.list.queryKey({ collectiviteId }),
      });
      if (startedHere && !isProgressDisplayed.current) {
        setToast('error', appLabels.importPlanIaErreur);
      }
    }
  }, [
    ongoingJobId,
    ongoingStatus,
    startedJobId,
    queryClient,
    trpc,
    collectiviteId,
    setToast,
  ]);

  const trackImport = useCallback(
    (jobId: string, planId: number) => {
      setStartedJobId(jobId);
      // Le rattachement peut échouer sans compromettre l'import : la ligne du
      // tableau dit si le plan est rattaché, le toast d'erreur global dit
      // pourquoi.
      linkIfFirstPlan(planId).catch(() => undefined);
    },
    [linkIfFirstPlan]
  );

  const value = useMemo(
    () => ({
      isEnabled,
      isOngoing,
      trackImport,
      setIsProgressDisplayed: (isDisplayed: boolean) => {
        isProgressDisplayed.current = isDisplayed;
      },
    }),
    [isEnabled, isOngoing, trackImport]
  );

  return (
    <ImportProgrammeContext.Provider value={value}>
      {children}
    </ImportProgrammeContext.Provider>
  );
};
