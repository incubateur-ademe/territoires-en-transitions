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
import { useDemarcheId } from '@/app/demarches/use-demarche-id';
import { useDemarcheTracker } from '@/app/demarches/use-demarche-tracker';
import type { DemarchePcaet } from '@/app/demarches/types';
import { appLabels } from '@/app/labels/catalog';
import { useListDemarchePlanLinks } from '@/app/demarches/data/use-list-plan-links';
import { DeleteFailedImportPlanButton } from '@/app/plans/plans/components/delete-failed-import-plan.button';
import { PlanImportStatusBadge } from '@/app/plans/plans/components/plan-import-status.badge';
import type { AiImportDefaults } from '@/app/plans/plans/import-plan/ai-import.form';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import {
  PlanListItem,
  useListPlans,
} from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { useListPlanSecteursCounts } from '@/app/plans/plans/secteurs-counts/data/use-list-plan-secteurs-counts';
import { useQueries } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { isDemarchePcaetEnCours } from '@tet/domain/demarches';
import {
  Badge,
  Button,
  cn,
  Event,
  Icon,
  SplitButton,
  TableHeaderCell,
} from '@tet/ui';
import {
  countPlanSecteursARenseigner,
  isPlanNavigable,
  isPlanPendingVerification,
  PlanSourceEnum,
  planStatusValues,
  PlanStatusEnum,
} from '@tet/domain/plans';
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

const makePlanUrl = (
  collectiviteId: number,
  planId: number,
  { openSecteurs = false }: { openSecteurs?: boolean } = {}
) =>
  makeCollectivitePlanActionUrl({
    collectiviteId,
    planActionUid: planId.toString(),
    openSecteurs,
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
  secteursARenseigner,
  isReadonly,
  onLinkPlan,
  onUnlinkPlan,
}: {
  plan: PlanListItem;
  collectiviteId: number;
  isLinked: boolean;
  /** Actions du plan dont le secteur réglementaire reste à renseigner. */
  secteursARenseigner: number;
  /** Titre de l'autre démarche active qui tient déjà ce plan. */
  heldByTitre?: string;
  isReadonly: boolean;
  onLinkPlan: (planId: number) => void;
  onUnlinkPlan: (planId: number) => void;
}) => {
  const planUrl = makePlanUrl(collectiviteId, plan.id);
  const nom =
    plan.nom ?? appLabels.demarcheProgrammePlanParDefaut({ id: plan.id });
  const isImporting = plan.status === PlanStatusEnum.IMPORTING;
  // Seul un plan associé à la démarche a quelque chose à faire avant le dépôt.
  const isAVerifier = isLinked && isPlanPendingVerification(plan);
  const hasSecteursARenseigner = isLinked && secteursARenseigner > 0;
  const hasActionsAFaire = isAVerifier || hasSecteursARenseigner;

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
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Nouvel onglet : le rattachement se fait ici, aller voir le plan
                ne doit pas faire perdre le fil du dépôt. L'icône l'annonce. */}
            {isPlanNavigable(plan) ? (
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
            ) : (
              <span className="text-grey-8" data-test="demarches.plan.nom">
                {nom}
              </span>
            )}
            {plan.status === PlanStatusEnum.FAILED && (
              <PlanImportStatusBadge status={plan.status} />
            )}
          </div>
          {plan.source === PlanSourceEnum.IMPORT_IA && (
            <span className="text-xs text-grey-7">
              {appLabels.demarcheProgrammeGenereDepuisPdf}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-grey-7">
        {!isImporting && (plan.totalFiches ?? 0)}
      </td>
      <td className="px-4 py-3" data-test="demarches.plan.actions-a-faire">
        {isImporting ? (
          <span className="inline-flex items-center gap-2 text-sm text-grey-7">
            <SpinnerLoader className="w-4 h-4" />
            {appLabels.demarcheProgrammeImportEnCoursLigne}
          </span>
        ) : hasActionsAFaire ? (
          <div className="flex flex-col items-start gap-1">
            {isAVerifier && (
              <Badge
                title={appLabels.demarcheProgrammeAVerifierEtValider}
                variant="warning"
                size="sm"
                dataTest="demarches.plan.a-verifier-badge"
              />
            )}
            {hasSecteursARenseigner && (
              <Badge
                title={appLabels.demarcheProgrammeSecteursARenseigner({
                  count: secteursARenseigner,
                })}
                variant="warning"
                size="sm"
                dataTest="demarches.plan.secteurs-badge"
              />
            )}
          </div>
        ) : (
          <span className="text-sm text-grey-7">
            {isLinked
              ? appLabels.demarcheProgrammeAucuneActionAFaire
              : appLabels.demarcheProgrammeSansActionAFaire}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {plan.status === PlanStatusEnum.FAILED && !isReadonly && (
            <DeleteFailedImportPlanButton planId={plan.id} />
          )}
          {hasActionsAFaire && !isReadonly && (
            <Button
              size="xs"
              icon="arrow-right-line"
              iconPosition="right"
              className="whitespace-nowrap"
              href={makePlanUrl(collectiviteId, plan.id, {
                openSecteurs: hasSecteursARenseigner,
              })}
              dataTest="demarches.plan.completer-button"
            >
              {isAVerifier
                ? appLabels.demarcheProgrammeVerifierEtCompleter
                : appLabels.demarcheProgrammeCompleter}
            </Button>
          )}
          {isLinked ? (
            <Button
              variant="outlined"
              size="xs"
              icon="link-unlink"
              onClick={() => onUnlinkPlan(plan.id)}
              disabled={isReadonly}
              dataTest="demarches.plan.dissocier-button"
            >
              {appLabels.demarcheProgrammeDissocier}
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
 * Ajout d'un plan au programme. Importer prime : le programme existe déjà dans
 * le document déposé. La création manuelle est rangée derrière la flèche.
 *
 * Le bouton change de place selon qu'il existe des plans à associer, les
 * modales non : un import qui crée son plan ferait sinon disparaître, avec le
 * bouton, la modale qui en suit la progression.
 */
const useCreatePlanAction = ({
  planTypeId,
  isReadonly,
  onCreatePlan,
  importDefaults,
  linkedPlanIds,
}: {
  /** Type pré-sélectionné dans la modale de création. */
  planTypeId: number | undefined;
  linkedPlanIds: number[];
  isReadonly: boolean;
  importDefaults?: AiImportDefaults;
  onCreatePlan: (payload: DemarcheCreatePlanPayload) => Promise<boolean>;
}) => {
  const track = useDemarcheTracker({ id: useDemarcheId() });
  const openPlanModal = (
    type: 'creer' | 'importer_ia' | 'demander_import',
    open: (isOpen: boolean) => void
  ) => {
    track(Event.demarches.pcaet.planModale, { type, etat: 'ouverte' });
    open(true);
  };
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

  const renderButton = (variant: 'primary' | 'outlined') => (
    <SplitButton
      size="sm"
      variant={variant}
      className="shrink-0"
      icon={<Icon icon="import-line" />}
      onClick={() =>
        isAiPlanImportEnabled
          ? openPlanModal('importer_ia', setIsImportPlanModalOpen)
          : openPlanModal('demander_import', setIsRequestPlanImportModalOpen)
      }
      disabled={isReadonly}
      dataTest="demarches.plan.importer-plan-button"
      menuDataTest="demarches.plan.creer-plan-menu"
      menuActions={[
        {
          icon: 'add-line',
          label: appLabels.demarcheProgrammeCreerPlan,
          onClick: () => openPlanModal('creer', setIsCreatePlanModalOpen),
          disabled: isReadonly,
        },
      ]}
    >
      {isImportOngoing ? (
        <span role="status" className="inline-flex items-center gap-2">
          {appLabels.importPlanIaEnCoursCourt}
          <SpinnerLoader className="w-4 h-4" />
        </span>
      ) : (
        appLabels.demarcheProgrammeImporterPlan
      )}
    </SplitButton>
  );

  const modals = (
    <>
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
        linkedPlanIds={linkedPlanIds}
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

  return { renderButton, modals };
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
  footerAction,
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
  footerAction?: ReactNode;
}) => {
  const hasPlans = plans.length > 0;
  const { countsByPlanId } = useListPlanSecteursCounts(
    collectiviteId,
    plans.map((plan) => plan.id)
  );
  const secteursARenseignerDe = (planId: number) => {
    const counts = countsByPlanId.get(planId);
    return counts === undefined ? 0 : countPlanSecteursARenseigner(counts);
  };

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
                  className="w-24"
                />
                <TableHeaderCell
                  title={appLabels.demarcheProgrammeColonneActionsAFaire}
                  className="w-56"
                />
                <TableHeaderCell className="w-72" />
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
                    secteursARenseigner={secteursARenseignerDe(plan.id)}
                    isReadonly={isReadonly}
                    onLinkPlan={onLinkPlan}
                    onUnlinkPlan={onUnlinkPlan}
                  />
                ))
              ) : (
                <tr data-test="demarches.plan.table-empty">
                  <td colSpan={4} className="px-4 py-10 text-center">
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
        {footerAction && <div className="flex">{footerAction}</div>}
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
  // Miroir du gating serveur : pendant la phase d'avis et après la publication,
  // le serveur refuse toute modification (DEMARCHE_PCAET_NON_MODIFIABLE).
  const isReadonly = !demarche.contenuModifiable;

  const { plans, isLoading: isLoadingPlans } = useListPlans(collectiviteId, {
    typeIds: planTypeId !== undefined ? [planTypeId] : undefined,
    statuses: planStatusValues,
    enabled: planTypeId !== undefined,
  });

  // Plans déjà tenus par une autre démarche active : rattachement désactivé.
  // Une démarche adoptée/archivée libère son plan, donc ne bloque pas ici —
  // c'est en revanche exactement ce lien-là que le bandeau du plan doit
  // continuer d'afficher (cf. useDemarcheLinkedToPlan).
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

  const rows = [...missingLinkedPlansQuery, ...plans].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

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

  const isLoading =
    isLoadingEligibility || (planTypeId !== undefined && isLoadingPlans);

  // Des plans à associer : l'association est l'action attendue, les utilisateurs
  // cliquaient sur le titre du plan. L'import passe alors sous le tableau, en
  // second. Sans plan, il reste l'action principale, à hauteur du titre.
  const hasEligiblePlans = rows.length > 0;
  const { renderButton: renderCreatePlanButton, modals: createPlanModals } =
    useCreatePlanAction({
      planTypeId,
      isReadonly,
      onCreatePlan,
      importDefaults,
      linkedPlanIds,
    });

  const renderContent = () => {
    if (isLoading) {
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
        footerAction={
          hasEligiblePlans ? renderCreatePlanButton('outlined') : undefined
        }
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
        isReadonly ? undefined : appLabels.demarcheProgrammeRattachementIntro
      }
      action={
        isLoading || hasEligiblePlans
          ? undefined
          : renderCreatePlanButton('primary')
      }
    >
      {renderContent()}
      {createPlanModals}
    </DemarcheSection>
  );
};
