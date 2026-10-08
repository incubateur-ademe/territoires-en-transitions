'use client';

import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import {
  DemarcheCreatePlanModal,
  type DemarcheCreatePlanPayload,
} from '@/app/demarches/components/create-plan.modal';
import { DemarcheImportPlanModal } from '@/app/demarches/components/import-plan.modal';
import { DemarcheRequestPlanImportModal } from '@/app/demarches/components/request-plan-import.modal';
import { useImportProgramme } from '@/app/demarches/pcaet/import-programme/import-programme.context';
import type { DemarchePcaetUpdatePatch } from '@/app/demarches/types';
import type { DemarchePcaet } from '@/app/demarches/types';
import { appLabels } from '@/app/labels/catalog';
import { useListDemarchePlanLinks } from '@/app/demarches/data/use-list-plan-links';
import { BetaLabel } from '@/app/ui/beta.label';
import type { AiImportDefaults } from '@/app/plans/plans/import-plan/ai-import.form';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import {
  PlanListItem,
  useListPlans,
} from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import {
  PlanSecteursCounts,
  useListPlanSecteursCounts,
} from '@/app/plans/plans/secteurs-counts/data/use-list-plan-secteurs-counts';
import { formatPlanSecteursCounts } from '@/app/plans/plans/secteurs-counts/format-plan-secteurs-counts';
import { useQueries } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
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
import { ReactNode, useEffect, useState } from 'react';
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
  isSecteursColumnVisible,
  secteursCounts,
  isReadonly,
  onLinkPlan,
  onUnlinkPlan,
}: {
  plan: PlanListItem;
  collectiviteId: number;
  isLinked: boolean;
  isSecteursColumnVisible: boolean;
  secteursCounts: PlanSecteursCounts | undefined;
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
      {isSecteursColumnVisible && (
        <td
          className="px-4 py-3 text-sm text-grey-7"
          data-test="demarches.plan.secteurs-counts"
        >
          {secteursCounts && (
            <div className="flex flex-col gap-1">
              {formatPlanSecteursCounts(secteursCounts).map((count) => (
                <span key={count}>{count}</span>
              ))}
            </div>
          )}
        </td>
      )}
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
 * Ajout d'un plan au programme, à hauteur du titre de la section : c'est
 * l'action de l'écran, pas celle du tableau. Importer prime : le programme
 * existe déjà dans le document déposé. La création manuelle est rangée derrière
 * la flèche.
 */
const CreatePlanAction = ({
  planTypeId,
  isReadonly,
  onCreatePlan,
  importDefaults,
}: {
  /** Type pré-sélectionné dans la modale de création. */
  planTypeId: number | undefined;
  isReadonly: boolean;
  importDefaults?: AiImportDefaults;
  onCreatePlan: (payload: DemarcheCreatePlanPayload) => Promise<boolean>;
}) => {
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false);
  const [isImportPlanModalOpen, setIsImportPlanModalOpen] = useState(false);
  const [isRequestPlanImportModalOpen, setIsRequestPlanImportModalOpen] =
    useState(false);

  // La fin de l'import se traite au niveau de la démarche, la modale démontant
  // son contenu à la fermeture. Ouverte, elle affiche déjà l'échec en détail.
  const {
    isEnabled: isAiPlanImportEnabled,
    isOngoing: isImportOngoing,
    trackImport,
    setIsProgressDisplayed,
  } = useImportProgramme();
  useEffect(() => {
    setIsProgressDisplayed(isImportPlanModalOpen);
    return () => setIsProgressDisplayed(false);
  }, [isImportPlanModalOpen, setIsProgressDisplayed]);

  return (
    <>
      <SplitButton
        size="sm"
        className="shrink-0"
        icon={<Icon icon="import-line" />}
        onClick={() =>
          isAiPlanImportEnabled
            ? setIsImportPlanModalOpen(true)
            : setIsRequestPlanImportModalOpen(true)
        }
        disabled={isReadonly}
        dataTest="demarches.plan.importer-plan-button"
        menuDataTest="demarches.plan.creer-plan-menu"
        menuActions={[
          {
            icon: 'add-line',
            label: appLabels.demarcheProgrammeCreerPlan,
            onClick: () => setIsCreatePlanModalOpen(true),
            disabled: isReadonly,
          },
        ]}
      >
        {!isAiPlanImportEnabled ? (
          appLabels.demarcheProgrammeImporterPlan
        ) : isImportOngoing ? (
          <span role="status" className="inline-flex items-center gap-2">
            {appLabels.importPlanIaEnCoursCourt}
            <SpinnerLoader className="w-4 h-4" />
          </span>
        ) : (
          <BetaLabel>{appLabels.demarcheProgrammeImporterPlan}</BetaLabel>
        )}
      </SplitButton>
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
        onImportStarted={trackImport}
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
  const { isEnabled: isSecteursColumnVisible, countsByPlanId } =
    useListPlanSecteursCounts(
      collectiviteId,
      plans.map((plan) => plan.id)
    );

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
                {isSecteursColumnVisible && (
                  <TableHeaderCell
                    title={appLabels.demarcheProgrammeColonneSecteurs}
                    className="w-56 whitespace-nowrap"
                  />
                )}
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
                    isSecteursColumnVisible={isSecteursColumnVisible}
                    secteursCounts={countsByPlanId.get(plan.id)}
                    isReadonly={isReadonly}
                    onLinkPlan={onLinkPlan}
                    onUnlinkPlan={onUnlinkPlan}
                  />
                ))
              ) : (
                <tr data-test="demarches.plan.table-empty">
                  <td
                    colSpan={isSecteursColumnVisible ? 4 : 3}
                    className="px-4 py-10 text-center"
                  >
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
          importDefaults={importDefaults}
        />
      }
    >
      {renderContent()}
    </DemarcheSection>
  );
};
