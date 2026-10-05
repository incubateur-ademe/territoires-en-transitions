'use client';

import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import {
  DemarcheCreatePlanModal,
  type DemarcheCreatePlanPayload,
} from '@/app/demarches/components/create-plan.modal';
import { DemarcheImportPlanModal } from '@/app/demarches/components/import-plan.modal';
import { DemarcheRequestPlanImportModal } from '@/app/demarches/components/request-plan-import.modal';
import type { DemarchePcaetUpdatePatch } from '@/app/demarches/types';
import type { DemarchePcaet } from '@/app/demarches/types';
import { appLabels } from '@/app/labels/catalog';
import { useListDemarchePlanLinks } from '@/app/demarches/data/use-list-plan-links';
import { BetaLabel } from '@/app/ui/beta.label';
import type { AiImportDefaults } from '@/app/plans/plans/import-plan/ai-import.form';
import { useGetOngoingAiImport } from '@/app/plans/plans/import-plan/data/use-get-ongoing-ai-import';
import { useIsAiPlanImportEnabled } from '@/app/plans/plans/import-plan/use-is-ai-plan-import-enabled';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useToastContext } from '@/app/utils/toast/toast-context';
import {
  PlanListItem,
  useListPlans,
} from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import {
  useCollectiviteId,
  useCurrentCollectivite,
} from '@tet/api/collectivites';
import { isDemarchePcaetEnCours } from '@tet/domain/demarches';
import {
  Alert,
  Badge,
  Button,
  cn,
  Icon,
  SplitButton,
  TableHeaderCell,
} from '@tet/ui';
import { isPlanPendingVerification } from '@tet/domain/plans';
import Link from 'next/link';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { DemarcheSection } from './section';

/**
 * Rattachement d'un programme d'actions : commun à tous les types de démarches.
 * Ce qui varie d'un type à l'autre — quel type de plan est éligible et sous
 * quel libellé — est injecté par l'appelant.
 */
type DemarchePlanEligibility = {
  /** Libellé du type de plan attendu, affiché à défaut de celui du plan. */
  planTypeLabel: string;
  /** Id du type de plan éligible, résolu par l'appelant. */
  planTypeId: number | undefined;
};

type Props = {
  demarche: DemarchePcaet;
  eligibility: DemarchePlanEligibility;
  /** Résolution du type de plan éligible encore en cours côté appelant. */
  isLoadingEligibility?: boolean;
  /**
   * Forme fonctionnelle acceptée : le rattachement étant cumulatif, le patch se
   * calcule à partir de l'ensemble courant.
   */
  onUpdateAction: (
    patch:
      | DemarchePcaetUpdatePatch
      | ((current: DemarchePcaet) => DemarchePcaetUpdatePatch)
  ) => void;
  /** Crée le plan (type imposé par l'appelant) et le rattache à la démarche. */
  onCreatePlan: (payload: DemarcheCreatePlanPayload) => Promise<boolean>;
  /** Fichier et nom proposés d'office à l'import par IA. */
  importDefaults?: AiImportDefaults;
};

/**
 * Actions du plan, tous axes confondus. Une même fiche peut être rangée dans
 * plusieurs axes : on compte les identifiants distincts, pas les rattachements.
 */
const countPlanFiches = (plan: PlanListItem): number =>
  new Set(plan.axes.flatMap((axe) => axe.fiches)).size;

const makePlanUrl = (collectiviteId: number, planId: number) =>
  makeCollectivitePlanActionUrl({
    collectiviteId,
    planActionUid: planId.toString(),
  });

const ProgrammeActionsColumn = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col gap-6 min-w-0">{children}</div>
);

const LoadingPlaceholder = ({ label }: { label: string }) => (
  <div className="rounded-lg border border-grey-3 p-6 text-sm text-grey-7">
    {label}
  </div>
);

const ProgrammeActionsLoading = () => (
  <ProgrammeActionsColumn>
    <LoadingPlaceholder label={appLabels.demarcheProgrammeChargement} />
  </ProgrammeActionsColumn>
);

const ProgrammeActionsPlanRow = ({
  plan,
  collectiviteId,
  isLinked,
  heldByTitre,
  isReadonly,
  onLinkPlan,
  onUnlinkPlan,
}: {
  plan: PlanListItem;
  collectiviteId: number;
  isLinked: boolean;
  /** Titre de l'autre démarche active qui tient déjà ce plan. */
  heldByTitre?: string;
  isReadonly: boolean;
  onLinkPlan: (planId: number) => void;
  onUnlinkPlan: (planId: number) => void;
}) => {
  const planUrl = makePlanUrl(collectiviteId, plan.id);
  const nom =
    plan.nom ?? appLabels.demarcheProgrammePlanParDefaut({ id: plan.id });

  return (
    <tr
      className={cn(
        'border-b border-grey-3 last:border-b-0',
        isLinked ? 'bg-primary-1' : 'even:bg-grey-1'
      )}
      data-test="demarches.plan.row"
      data-linked={isLinked}
    >
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Nouvel onglet : le rattachement se fait ici, aller voir le plan ne
              doit pas faire perdre le fil du dépôt. L'icône l'annonçait déjà. */}
          <Link
            href={planUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-9 hover:underline"
            data-test="demarches.plan.ouvrir-plan-link"
          >
            {nom}
            <Icon icon="external-link-line" className="ml-2" />
          </Link>
          {isPlanPendingVerification(plan) && (
            <Link
              href={planUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-test="demarches.plan.a-verifier-badge"
            >
              <Badge
                title={appLabels.demarcheProgrammePlanAVerifier}
                variant="warning"
                size="sm"
              />
            </Link>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-grey-7">
        {appLabels.demarcheProgrammeNombreActions({
          count: countPlanFiches(plan),
        })}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {isLinked ? (
            <Button
              variant="outlined"
              size="xs"
              icon="link-unlink"
              onClick={() => onUnlinkPlan(plan.id)}
              disabled={isReadonly}
              dataTest="demarches.plan.detacher-button"
            >
              {appLabels.demarcheProgrammeDetacher}
            </Button>
          ) : heldByTitre !== undefined ? (
            <div className="flex flex-col items-end gap-1">
              <Button
                variant="outlined"
                size="xs"
                icon="link"
                disabled
                dataTest="demarches.plan.link-button"
              >
                {appLabels.demarcheProgrammeLierCePlan}
              </Button>
              <p
                className="m-0 text-xs text-grey-7"
                data-test="demarches.plan.deja-rattache"
              >
                {appLabels.demarcheProgrammePlanDejaRattache({
                  titre: heldByTitre,
                })}
              </p>
            </div>
          ) : (
            <Button
              variant="outlined"
              size="xs"
              icon="link"
              onClick={() => onLinkPlan(plan.id)}
              disabled={isReadonly}
              dataTest="demarches.plan.link-button"
            >
              {appLabels.demarcheProgrammeLierCePlan}
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};

/**
 * Création d'un plan du programme, à hauteur du titre de la section : c'est
 * l'action de l'écran, pas celle du tableau. Créer prime sur importer, rangé
 * derrière la flèche.
 */
const CreatePlanAction = ({
  planTypeId,
  isReadonly,
  onCreatePlan,
  onPlanImported,
  importDefaults,
}: {
  /** Type pré-sélectionné dans la modale de création. */
  planTypeId: number | undefined;
  isReadonly: boolean;
  importDefaults?: AiImportDefaults;
  onCreatePlan: (payload: DemarcheCreatePlanPayload) => Promise<boolean>;
  /** Appelé seulement pour un import lancé depuis cette page. */
  onPlanImported: (planId: number) => void;
}) => {
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false);
  const [isImportPlanModalOpen, setIsImportPlanModalOpen] = useState(false);
  const [isRequestPlanImportModalOpen, setIsRequestPlanImportModalOpen] =
    useState(false);
  const isAiPlanImportEnabled = useIsAiPlanImportEnabled();

  // Suivi de l'import ici et non dans la modale, qui démonte son contenu à la
  // fermeture : l'import continue, et sa fin doit être traitée quand même.
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setToast } = useToastContext();
  const {
    jobId: ongoingJobId,
    status: ongoingStatus,
    isOngoing: isImportOngoing,
  } = useGetOngoingAiImport(collectiviteId, {
    enabled: isAiPlanImportEnabled,
  });
  const [startedJobId, setStartedJobId] = useState<string | null>(null);
  const handledJobId = useRef<string | null>(null);
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
        onPlanImported(ongoingStatus.createdPlanId);
      }
    } else if (ongoingStatus?.status === 'failed') {
      handledJobId.current = ongoingJobId;
      // Modale ouverte, l'échec y est déjà affiché avec son détail.
      if (startedHere && !isImportPlanModalOpen) {
        setToast('error', appLabels.importPlanIaErreur);
      }
    }
  }, [
    ongoingJobId,
    ongoingStatus,
    startedJobId,
    isImportPlanModalOpen,
    onPlanImported,
    queryClient,
    trpc,
    collectiviteId,
    setToast,
  ]);

  return (
    <>
      {/* La pastille signale un import en cours sans ouvrir le menu, sur la
          flèche qui y mène. */}
      <div className="relative shrink-0">
        <SplitButton
          size="sm"
          icon={<Icon icon="add-line" />}
          onClick={() => setIsCreatePlanModalOpen(true)}
          disabled={isReadonly}
          dataTest="demarches.plan.creer-pcaet-button"
          menuDataTest="demarches.plan.creer-plan-menu"
          menuActions={[
            isAiPlanImportEnabled
              ? {
                  icon: 'import-line',
                  label: isImportOngoing ? (
                    <span className="inline-flex items-center gap-2">
                      {appLabels.importPlanIaEnCoursCourt}
                      <SpinnerLoader className="w-4 h-4" />
                    </span>
                  ) : (
                    <BetaLabel>
                      {appLabels.demarcheProgrammeImporterPlan}
                    </BetaLabel>
                  ),
                  onClick: () => setIsImportPlanModalOpen(true),
                  disabled: isReadonly,
                }
              : {
                  icon: 'import-line',
                  label: appLabels.demarcheProgrammeImporterPlan,
                  onClick: () => setIsRequestPlanImportModalOpen(true),
                  disabled: isReadonly,
                },
          ]}
        >
          {appLabels.demarcheProgrammeCreerPlan}
        </SplitButton>
        {isImportOngoing && (
          <span
            role="status"
            aria-label={appLabels.importPlanIaEnCoursCourt}
            title={appLabels.importPlanIaEnCoursCourt}
            data-test="demarches.plan.import-en-cours-badge"
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-warning-1 ring-2 ring-white"
          />
        )}
      </div>
      <DemarcheCreatePlanModal
        defaultTypeId={planTypeId}
        openState={{
          isOpen: isCreatePlanModalOpen,
          setIsOpen: setIsCreatePlanModalOpen,
        }}
        onCreatePlan={onCreatePlan}
      />
      <DemarcheImportPlanModal
        planTypeId={planTypeId}
        importDefaults={importDefaults}
        openState={{
          isOpen: isImportPlanModalOpen,
          setIsOpen: setIsImportPlanModalOpen,
        }}
        onImportStarted={setStartedJobId}
      />
      <DemarcheRequestPlanImportModal
        openState={{
          isOpen: isRequestPlanImportModalOpen,
          setIsOpen: setIsRequestPlanImportModalOpen,
        }}
      />
    </>
  );
};

const ListEligiblePlansTable = ({
  planTypeLabel,
  plans,
  collectiviteId,
  linkedPlanIds,
  heldTitresByPlanId,
  isReadonly,
  onLinkPlan,
  onUnlinkPlan,
}: {
  planTypeLabel: string;
  plans: PlanListItem[];
  collectiviteId: number;
  /** Plans déjà rattachés à cette démarche : le rattachement est cumulatif. */
  linkedPlanIds: number[];
  /** Titre de la démarche active tenant chaque plan déjà pris. */
  heldTitresByPlanId: Map<number, string>;
  /** La démarche n'est plus en élaboration : tout rattachement est figé. */
  isReadonly: boolean;
  onLinkPlan: (planId: number) => void;
  onUnlinkPlan: (planId: number) => void;
}) => {
  const hasPlans = plans.length > 0;

  return (
    <ProgrammeActionsColumn>
      {isReadonly && (
        <p
          className="m-0 text-sm text-grey-7"
          data-test="demarches.plan.lecture-seule"
        >
          {appLabels.demarcheProgrammeLectureSeule}
        </p>
      )}
      <div className="flex flex-col gap-4">
        <div
          className="w-full rounded-xl border border-grey-3 overflow-hidden"
          data-test="demarches.plan.table"
        >
          <table className="w-full border-collapse">
            <thead className="border-b border-grey-3">
              <tr>
                <TableHeaderCell
                  title={appLabels.demarcheProgrammeColonneNom}
                  className="w-auto"
                />
                <TableHeaderCell
                  title={appLabels.demarcheProgrammeColonneNombreActions}
                  className="w-48"
                />
                <TableHeaderCell className="w-48" />
              </tr>
            </thead>
            <tbody>
              {hasPlans ? (
                plans.map((plan) => (
                  <ProgrammeActionsPlanRow
                    key={plan.id}
                    plan={plan}
                    collectiviteId={collectiviteId}
                    isLinked={linkedPlanIds.includes(plan.id)}
                    heldByTitre={heldTitresByPlanId.get(plan.id)}
                    isReadonly={isReadonly}
                    onLinkPlan={onLinkPlan}
                    onUnlinkPlan={onUnlinkPlan}
                  />
                ))
              ) : (
                <tr data-test="demarches.plan.table-empty">
                  <td colSpan={3} className="px-4 py-10 text-center">
                    <p className="m-0 text-sm font-medium text-grey-8">
                      {appLabels.demarcheProgrammeNoPlanIntro({
                        typeLabel: planTypeLabel,
                      })}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!isReadonly && (
          <div data-test="demarches.plan.verifier-plans-info">
            <Alert
              state="info"
              title={appLabels.demarcheProgrammeVerifierPlansTitre}
              description={appLabels.demarcheProgrammeVerifierPlansDescription}
            />
          </div>
        )}
      </div>
    </ProgrammeActionsColumn>
  );
};

export const ProgrammeActionsSection = ({
  demarche,
  eligibility,
  isLoadingEligibility = false,
  onUpdateAction,
  onCreatePlan,
  importDefaults,
}: Props) => {
  const collectivite = useCurrentCollectivite();
  const { collectiviteId } = collectivite;
  const trpc = useTRPC();
  const { planTypeId } = eligibility;
  // Miroir du gating serveur : hors élaboration, le serveur refuse toute
  // modification (DEMARCHE_NON_MODIFIABLE).
  const isReadonly = !demarche.amontModifiable;

  const { plans, isLoading: isLoadingPlans } = useListPlans(collectiviteId, {
    typeIds: planTypeId !== undefined ? [planTypeId] : undefined,
    enabled: planTypeId !== undefined,
  });

  // Plans déjà tenus par une autre démarche active : rattachement désactivé.
  // Une démarche adoptée/archivée libère son plan, donc ne bloque pas ici —
  // c'est en revanche exactement ce lien-là que le bandeau du plan doit
  // continuer d'afficher (cf. useIsDemarchePcaetBannerVisibleInPlan).
  const { links: planLinks } = useListDemarchePlanLinks(collectiviteId);
  const heldTitresByPlanId = new Map(
    planLinks
      .filter(
        (link) =>
          link.demarcheId !== demarche.id && isDemarchePcaetEnCours(link.status)
      )
      .map((link) => [link.planActionId, link.titre])
  );

  // Un plan rattaché reste affiché même si son type a changé depuis : ceux que
  // le filtre de type ne ramène pas sont chargés un par un.
  const linkedPlanIds = demarche.planActionIds;
  const missingLinkedPlanIds = isLoadingPlans
    ? []
    : linkedPlanIds.filter((id) => !plans.some((plan) => plan.id === id));
  const missingLinkedPlansQuery = useQueries({
    queries: missingLinkedPlanIds.map((planId) =>
      trpc.plans.plans.get.queryOptions({ planId })
    ),
    combine: (results) => results.flatMap((result) => result.data ?? []),
  });

  const rows = [...missingLinkedPlansQuery, ...plans];

  const linkPlan = (planId: number) => {
    onUpdateAction((current) => ({
      planActionIds: [...current.planActionIds, planId],
    }));
  };

  // Même règle que la création : seul le premier plan est rattaché d'office.
  // Le rattachement part en différé et peut échouer : le toast n'annonce que
  // l'import, la ligne du tableau dit si le plan est rattaché. Un import lancé
  // ailleurs ne passe pas ici : son plan reste à lier depuis le tableau.
  const { setToast } = useToastContext();
  const handlePlanImported = (planId: number) => {
    if (linkedPlanIds.length === 0) {
      linkPlan(planId);
    }
    setToast('success', appLabels.importPlanIaPlanImporte);
  };

  const unlinkPlan = (planId: number) => {
    onUpdateAction((current) => ({
      planActionIds: current.planActionIds.filter((id) => id !== planId),
    }));
  };

  const renderContent = () => {
    if (isLoadingEligibility || (planTypeId !== undefined && isLoadingPlans)) {
      return <ProgrammeActionsLoading />;
    }
    return (
      <ListEligiblePlansTable
        planTypeLabel={eligibility.planTypeLabel}
        plans={rows}
        collectiviteId={collectiviteId}
        linkedPlanIds={linkedPlanIds}
        heldTitresByPlanId={heldTitresByPlanId}
        isReadonly={isReadonly}
        onLinkPlan={linkPlan}
        onUnlinkPlan={unlinkPlan}
      />
    );
  };

  return (
    <DemarcheSection
      title={appLabels.demarcheProgrammeTitre}
      // Le sous-titre passe par la section, comme celui des autres étapes de
      // l'élaboration : le rendre dans le contenu l'éloignait du titre de tout
      // l'interligne de la section. Hors élaboration, l'invitation à rattacher
      // n'aurait pas de sens — c'est le message de lecture seule qui la remplace.
      description={
        isReadonly
          ? undefined
          : appLabels.demarcheProgrammeRattachementIntro({
              type: appLabels.demarcheTypeLabels[demarche.type],
            })
      }
      action={
        <CreatePlanAction
          planTypeId={planTypeId}
          isReadonly={isReadonly}
          onCreatePlan={onCreatePlan}
          onPlanImported={handlePlanImported}
          importDefaults={importDefaults}
        />
      }
    >
      {renderContent()}
    </DemarcheSection>
  );
};
