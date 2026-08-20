'use client';

import {
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsImporterUrl,
} from '@/app/app/paths';
import {
  DemarcheCreatePlanModal,
  type DemarcheCreatePlanPayload,
} from '@/app/demarches/components/create-plan.modal';
import type { DemarchePcaetUpdatePatch } from '@/app/demarches/types';
import type { DemarchePcaet } from '@/app/demarches/types';
import { appLabels, type DemarcheTypeLabels } from '@/app/labels/catalog';
import { useListDemarchePlanLinks } from '@/app/demarches/data/use-list-plan-links';
import {
  PlanListItem,
  useListPlans,
} from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { isActiveDemarchePcaetStatus } from '@tet/domain/demarches';
import { Button, cn, Icon, TableHeaderCell } from '@tet/ui';
import Link from 'next/link';
import { ReactNode, useState } from 'react';
import { DemarcheSection } from './section';

/**
 * Rattachement d'un programme d'actions : commun à tous les types de démarches.
 * Ce qui varie d'un type à l'autre — quel type de plan est éligible et sous
 * quel libellé — est injecté par l'appelant.
 */
export type DemarchePlanEligibility = {
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
  onUpdateAction: (patch: DemarchePcaetUpdatePatch) => void;
  /** Crée le plan (type imposé par l'appelant) et le rattache à la démarche. */
  onCreatePlan: (payload: DemarcheCreatePlanPayload) => Promise<boolean>;
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
  onUnlinkPlan: () => void;
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
          <Link href={planUrl} className=" text-primary-9 hover:underline">
            {nom}
            <Icon icon="external-link-line" className="ml-2" />
          </Link>
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
              variant="grey"
              size="sm"
              icon="link-unlink"
              onClick={onUnlinkPlan}
              disabled={isReadonly}
              className="text-error-1 hover:text-[#db4f4f]"
              dataTest="demarches.plan.detacher-button"
            >
              {appLabels.demarcheProgrammeDetacher}
            </Button>
          ) : heldByTitre !== undefined ? (
            <div className="flex flex-col items-end gap-1">
              <Button
                variant="primary"
                size="sm"
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
              variant="primary"
              size="sm"
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

const ProgrammeActionsFrame = ({
  children,
  disabled = false,
}: {
  children: ReactNode;
  disabled?: boolean;
}) => (
  <div
    className={cn(
      'flex flex-col gap-4 rounded-lg border border-grey-3 bg-white p-6',
      disabled && 'pointer-events-none opacity-50'
    )}
    aria-disabled={disabled || undefined}
  >
    {children}
  </div>
);

const ListEligiblePlansTable = ({
  typeLabels,
  planTypeLabel,
  planTypeId,
  plans,
  collectiviteId,
  linkedPlanId,
  heldTitresByPlanId,
  isReadonly,
  onLinkPlan,
  onUnlinkPlan,
  onCreatePlan,
}: {
  typeLabels: DemarcheTypeLabels;
  planTypeLabel: string;
  /** Type pré-sélectionné dans la modale de création. */
  planTypeId: number | undefined;
  plans: PlanListItem[];
  collectiviteId: number;
  linkedPlanId: number | null;
  /** Titre de la démarche active tenant chaque plan déjà pris. */
  heldTitresByPlanId: Map<number, string>;
  /** La démarche n'est plus en élaboration : tout rattachement est figé. */
  isReadonly: boolean;
  onLinkPlan: (planId: number) => void;
  onUnlinkPlan: () => void;
  onCreatePlan: (payload: DemarcheCreatePlanPayload) => Promise<boolean>;
}) => {
  const isPlanLinked = linkedPlanId !== null;
  const hasPlans = plans.length > 0;
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false);

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
      <ProgrammeActionsFrame>
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-grey-9 m-0">
            {appLabels.demarcheProgrammeEtape1Titre({ type: typeLabels })}
          </p>
          <p className="text-grey-8 m-0">
            {hasPlans
              ? appLabels.demarcheProgrammeEtape1Description({
                  type: typeLabels,
                })
              : appLabels.demarcheProgrammeEtape1DescriptionSansPlan({
                  type: typeLabels,
                })}
          </p>
        </div>
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
                    isLinked={plan.id === linkedPlanId}
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
      </ProgrammeActionsFrame>
      <ProgrammeActionsFrame disabled={isPlanLinked || isReadonly}>
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-grey-9 m-0">
            {appLabels.demarcheProgrammeEtape2Titre}
          </p>
          <p className="text-grey-8 m-0">
            {appLabels.demarcheProgrammeEtape2Description({ type: typeLabels })}
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            size="sm"
            icon={<Icon icon="import-line" />}
            href={makeCollectivitePlansActionsImporterUrl({
              collectiviteId,
            })}
            disabled={isPlanLinked || isReadonly}
            dataTest="demarches.plan.creer-from-document-button"
          >
            {appLabels.demarcheProgrammeCreerNouveauPlanFromDocument({
              type: typeLabels,
            })}
          </Button>
          <Button
            variant="outlined"
            size="sm"
            icon={<Icon icon="add-line" />}
            onClick={() => setIsCreatePlanModalOpen(true)}
            disabled={isPlanLinked || isReadonly}
            dataTest="demarches.plan.creer-pcaet-button"
          >
            {appLabels.demarcheProgrammeCreerNouveauPlanFromZero}
          </Button>
        </div>
        <DemarcheCreatePlanModal
          defaultTypeId={planTypeId}
          openState={{
            isOpen: isCreatePlanModalOpen,
            setIsOpen: setIsCreatePlanModalOpen,
          }}
          onCreatePlan={onCreatePlan}
        />
      </ProgrammeActionsFrame>
    </ProgrammeActionsColumn>
  );
};

export const ProgrammeActionsSection = ({
  demarche,
  eligibility,
  isLoadingEligibility = false,
  onUpdateAction,
  onCreatePlan,
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
          link.demarcheId !== demarche.id &&
          isActiveDemarchePcaetStatus(link.status)
      )
      .map((link) => [link.planActionId, link.titre])
  );

  // Le plan rattaché reste affiché même si son type a changé depuis.
  const linkedPlanId = demarche.planActionId;
  const isLinkedPlanMissing =
    linkedPlanId !== null &&
    !isLoadingPlans &&
    !plans.some((plan) => plan.id === linkedPlanId);
  const { data: linkedPlanOutOfFilter } = useQuery(
    trpc.plans.plans.get.queryOptions(
      { planId: linkedPlanId ?? -1 },
      { enabled: isLinkedPlanMissing }
    )
  );

  const rows =
    isLinkedPlanMissing && linkedPlanOutOfFilter
      ? [linkedPlanOutOfFilter, ...plans]
      : plans;

  const linkPlan = (planId: number) => {
    onUpdateAction({ planActionId: planId });
  };

  const unlinkPlan = () => {
    onUpdateAction({ planActionId: null });
  };

  const renderContent = () => {
    if (isLoadingEligibility || (planTypeId !== undefined && isLoadingPlans)) {
      return <ProgrammeActionsLoading />;
    }
    return (
      <ListEligiblePlansTable
        typeLabels={appLabels.demarcheTypeLabels[demarche.type]}
        planTypeLabel={eligibility.planTypeLabel}
        planTypeId={planTypeId}
        plans={rows}
        collectiviteId={collectiviteId}
        linkedPlanId={linkedPlanId}
        heldTitresByPlanId={heldTitresByPlanId}
        isReadonly={isReadonly}
        onLinkPlan={linkPlan}
        onUnlinkPlan={unlinkPlan}
        onCreatePlan={onCreatePlan}
      />
    );
  };

  return (
    <DemarcheSection title={appLabels.demarcheProgrammeTitre}>
      {renderContent()}
    </DemarcheSection>
  );
};
