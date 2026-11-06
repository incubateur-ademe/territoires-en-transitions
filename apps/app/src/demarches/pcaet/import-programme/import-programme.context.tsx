'use client';

import { documentFileQueryOptions } from '@/app/collectivites/documents/data/use-get-document-file';
import {
  findPcaetPlanType,
  makeProgrammeActionsPlanName,
} from '@/app/demarches/pcaet/constants';
import { useDemarcheId } from '@/app/demarches/use-demarche-id';
import { appLabels } from '@/app/labels/catalog';
import { isAiImportVerifiable } from '@/app/plans/plans/import-plan/ai-import.form';
import { useEnqueueAiImport } from '@/app/plans/plans/import-plan/data/use-enqueue-ai-import';
import { useGetOngoingAiImport } from '@/app/plans/plans/import-plan/data/use-get-ongoing-ai-import';
import { useIsAiPlanImportEnabled } from '@/app/plans/plans/import-plan/use-is-ai-plan-import-enabled';
import { useListPlanTypes } from '@/app/plans/plans/use-list-plan-types';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RouterOutput, useTRPC, useTRPCClient } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { getErrorMessage } from '@tet/domain/utils';
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

type ImportStatus = RouterOutput['plans']['aiImport']['getAiImportStatus'];

type ImportProgrammeContextValue = {
  isEnabled: boolean;
  isOngoing: boolean;
  /** Statut de l'import courant de la collectivité, suivi jusqu'à son terme. */
  ongoingStatus: ImportStatus | undefined;
  /**
   * Crée le plan à partir du programme d'actions déposé. Un fichier déjà
   * importé n'est pas réimporté sans confirmation : on le signale.
   */
  startProgrammeImport: (fichierId: number) => Promise<void>;
  isStarting: boolean;
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
  const { collectiviteId, nom: collectiviteNom } = useCurrentCollectivite();
  const demarcheId = useDemarcheId();
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const { data: planTypes } = useListPlanTypes();
  const pcaetPlanType = findPcaetPlanType(planTypes);
  const { mutateAsync: enqueue } = useEnqueueAiImport();
  const [isStarting, setIsStarting] = useState(false);
  const queryClient = useQueryClient();
  const { setToast } = useToastContext();
  const demarcheQueryOptions = useMemo(
    () => trpc.demarches.pcaet.get.queryOptions({ collectiviteId, demarcheId }),
    [trpc, collectiviteId, demarcheId]
  );
  const isEnabled = useIsAiPlanImportEnabled();

  const {
    jobId: ongoingJobId,
    status: ongoingStatus,
    isOngoing,
  } = useGetOngoingAiImport(collectiviteId, { enabled: isEnabled });

  const [startedJobId, setStartedJobId] = useState<string | null>(null);
  // L'issue traitée, pas seulement le job : un import repris par l'équipe
  // aboutit après avoir échoué, sous le même identifiant.
  const handledOutcome = useRef<string | null>(null);
  const isProgressDisplayed = useRef(false);

  const { mutateAsync: updateDemarche } = useMutation(
    trpc.demarches.pcaet.update.mutationOptions()
  );

  // Même règle que la création : seul le premier plan est rattaché d'office.
  // La démarche est relue du serveur, le cache de la page pouvant dater.
  const linkIfFirstPlan = useCallback(
    async (planId: number) => {
      const demarche = await queryClient.fetchQuery(demarcheQueryOptions);
      if (!demarche.contenuModifiable || demarche.planActionIds.length > 0) {
        return;
      }
      const updated = await updateDemarche({
        collectiviteId,
        demarcheId,
        planActionIds: [planId],
      });
      queryClient.setQueryData(demarcheQueryOptions.queryKey, updated);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: trpc.demarches.pcaet.list.queryKey({ collectiviteId }),
        }),
        queryClient.invalidateQueries({
          queryKey: trpc.demarches.listPlanLinks.queryKey({ collectiviteId }),
        }),
      ]);
    },
    [
      collectiviteId,
      demarcheId,
      demarcheQueryOptions,
      queryClient,
      trpc,
      updateDemarche,
    ]
  );

  useEffect(() => {
    const outcome = `${ongoingJobId}:${ongoingStatus?.status}`;
    if (ongoingJobId === null || handledOutcome.current === outcome) {
      return;
    }
    // Le suivi est à la maille de la collectivité : un import lancé par
    // quelqu'un d'autre rafraîchit la liste mais ne toaste pas ici.
    const startedHere = ongoingJobId === startedJobId;
    if (
      ongoingStatus?.status === 'done' &&
      ongoingStatus.createdPlanId !== null
    ) {
      handledOutcome.current = outcome;
      for (const queryKey of [
        trpc.plans.plans.list.queryKey({ collectiviteId }),
        trpc.plans.aiImport.findPreviousAiImport.queryKey(),
      ]) {
        queryClient.invalidateQueries({ queryKey });
      }
      if (startedHere) {
        setToast('success', appLabels.demarcheProgrammeImportTermine);
      }
    } else if (ongoingStatus?.status === 'failed') {
      handledOutcome.current = outcome;
      queryClient.invalidateQueries({
        queryKey: trpc.plans.plans.list.queryKey({ collectiviteId }),
      });
      if (startedHere && !isProgressDisplayed.current) {
        setToast('error', appLabels.importPlanIaErreur);
      }
    } else if (ongoingStatus) {
      // Import repris : sa prochaine issue, même un nouvel échec, est traitée.
      handledOutcome.current = outcome;
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

  const startProgrammeImport = useCallback(
    async (fichierId: number) => {
      setIsStarting(true);
      try {
        const previousImport = await queryClient.fetchQuery(
          trpc.plans.aiImport.findPreviousAiImport.queryOptions(
            { collectiviteId, fichierId },
            { staleTime: 0 }
          )
        );
        if (previousImport !== null) {
          setToast(
            'info',
            appLabels.importPlanIaDejaImporteDescription({
              date: getTextFormattedDate({ date: previousImport.importedAt }),
              planNom: previousImport.planNom ?? appLabels.sansTitre,
            })
          );
          return;
        }
        const [file, demarche] = await Promise.all([
          queryClient.fetchQuery(
            documentFileQueryOptions(trpcClient, { collectiviteId, fichierId })
          ),
          queryClient.fetchQuery(demarcheQueryOptions),
        ]);
        const { jobId, planId } = await enqueue({
          collectiviteId,
          file,
          planName: makeProgrammeActionsPlanName({
            dateLancement: demarche.launchedAt,
            collectiviteNom,
          }),
          planType: pcaetPlanType?.id,
          withVerifications: isAiImportVerifiable(file),
          withSousActions: true,
        });
        trackImport(jobId, planId);
      } catch (error) {
        setToast('error', getErrorMessage(error));
      } finally {
        setIsStarting(false);
      }
    },
    [
      collectiviteId,
      collectiviteNom,
      demarcheQueryOptions,
      enqueue,
      pcaetPlanType,
      queryClient,
      setToast,
      trackImport,
      trpc,
      trpcClient,
    ]
  );

  const value = useMemo(
    () => ({
      isEnabled,
      isOngoing,
      ongoingStatus,
      startProgrammeImport,
      isStarting,
      trackImport,
      setIsProgressDisplayed: (isDisplayed: boolean) => {
        isProgressDisplayed.current = isDisplayed;
      },
    }),
    [
      isEnabled,
      isOngoing,
      ongoingStatus,
      startProgrammeImport,
      isStarting,
      trackImport,
    ]
  );

  return (
    <ImportProgrammeContext.Provider value={value}>
      {children}
    </ImportProgrammeContext.Provider>
  );
};
