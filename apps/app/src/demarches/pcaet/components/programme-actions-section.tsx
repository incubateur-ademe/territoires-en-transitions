'use client';

import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { PCAET_PLAN_TYPE_LABEL } from '@/app/demarches/pcaet/demarche-pcaet.constants';
import type { DemarchePcaet } from '@/app/demarches/pcaet/demarche-pcaet.types';
import type { DemarchePcaetUpdatePatch } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import { FichesListTable } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.table/fiches-list.table';
import {
  FicheListItem,
  useListFiches,
} from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import {
  PlanListItem,
  useListPlans,
} from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { useGetPlan } from '@/app/plans/plans/show-plan/data/use-get-plan';
import { useUpdatePlan } from '@/app/plans/plans/show-plan/data/use-update-plan';
import { PlanMetadata } from '@/app/plans/plans/show-plan/plan-metadata';
import { PlanStatus } from '@/app/plans/plans/show-plan/plan-status.chart';
import {
  CollectiviteCurrent,
  useCurrentCollectivite,
} from '@tet/api/collectivites';
import { FicheWithRelationsAndCollectivite } from '@tet/domain/plans';
import { Button, EmptyCard, Select } from '@tet/ui';
import { EmptyFichePicto } from '@/app/plans/fiches/list-all-fiches/components/empty-fiche.picto';
import Link from 'next/link';
import { ReactNode, useMemo, useState } from 'react';
import { makeCreatePcaetPlanUrl } from '../demarche-pcaet.constants';
import { DemarchePcaetSection } from './demarche-pcaet-section';

type Props = {
  demarche: DemarchePcaet;
  onUpdateAction: (patch: DemarchePcaetUpdatePatch) => void;
};

const isPcaetPlan = (typeLabel: string | null | undefined) =>
  typeLabel?.toLowerCase().includes('climat') ||
  typeLabel?.toLowerCase().includes('pcaet');

const makePlanUrl = (collectiviteId: number, planId: number) =>
  makeCollectivitePlanActionUrl({
    collectiviteId,
    planActionUid: planId.toString(),
  });

const ProgrammeActionsColumn = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col gap-6">{children}</div>
);

const LoadingPlaceholder = ({ label }: { label: string }) => (
  <div className="rounded-lg border border-grey-3 p-6 text-sm text-grey-7">
    {label}
  </div>
);

const ProgrammeActionsLoading = () => (
  <ProgrammeActionsColumn>
    <LoadingPlaceholder label="Chargement du plan et des actions…" />
  </ProgrammeActionsColumn>
);

const ProgrammeActionsNoPlan = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) => (
  <ProgrammeActionsColumn>
    <EmptyCard
      picto={(props) => <EmptyFichePicto {...props} />}
      title="Compléter le plan d'actions"
      variant="grey"
      size="xs"
      className="border-dashed"
      description={[
        `Aucun plan de type « ${PCAET_PLAN_TYPE_LABEL} » trouvé pour cette collectivité. Créez un plan pour afficher le programme d'actions.`,
        `Vous pourrez partir d'une trame générique (axes, sous-axes et actions) puis rattacher ce plan à la démarche PCAET.`,
      ]}
      actions={[
        {
          children: 'Créer le plan PCAET',
          variant: 'primary',
          href: makeCreatePcaetPlanUrl(collectiviteId),
          'data-test': 'demarche-creer-plan-pcaet',
        },
      ]}
    />
  </ProgrammeActionsColumn>
);

const ProgrammeActionsPlanHeader = ({
  planId,
  collectivite,
}: {
  planId: number;
  collectivite: CollectiviteCurrent;
}) => {
  const { collectiviteId } = collectivite;
  const plan = useGetPlan(planId);
  const { mutate: updatePlan } = useUpdatePlan({ collectiviteId });
  const isReadOnly = !collectivite.hasCollectivitePermission('plans.mutate');

  if (!plan) {
    return <LoadingPlaceholder label="Chargement du plan…" />;
  }

  const rootAxe = plan.axes.find((axe) => axe.parent === null);
  const title = rootAxe?.nom ?? plan.nom ?? 'Sans titre';
  const planUrl = makePlanUrl(collectiviteId, plan.id);

  return (
    <div className="flex flex-col gap-2" data-test="demarche-plan-header">
      <h3 className="text-2xl font-bold text-primary-9">
        <Link href={planUrl} className="hover:underline">
          {title}
        </Link>
      </h3>
      <PlanMetadata
        plan={plan}
        isReadOnly={isReadOnly}
        updatePlan={updatePlan}
      />
      <PlanStatus planId={plan.id} />
    </div>
  );
};

const ProgrammeActionsWithPlan = ({
  collectivite,
  plan,
  fiches,
  isLoadingFiches,
}: {
  collectivite: CollectiviteCurrent;
  plan: PlanListItem;
  fiches: FicheListItem[];
  isLoadingFiches: boolean;
}) => {
  const { collectiviteId } = collectivite;
  const planUrl = makePlanUrl(collectiviteId, plan.id);

  return (
    <ProgrammeActionsColumn>
      <ProgrammeActionsPlanHeader
        planId={plan.id}
        collectivite={collectivite}
      />
      <FichesListTable
        collectivite={collectivite}
        fiches={fiches as FicheWithRelationsAndCollectivite[]}
        isLoading={isLoadingFiches}
        isGroupedActionsOn={false}
        enableSelection={false}
      />
      <div className="flex justify-end">
        <Button
          variant="outlined"
          size="sm"
          href={planUrl}
          data-test="demarche-voir-plan-actions"
        >
          Voir toutes les actions du plan
        </Button>
      </div>
    </ProgrammeActionsColumn>
  );
};

const ProgrammeActionsSelectPlan = ({
  plans,
  selectedPlanId,
  collectiviteId,
  onSelectedPlanIdChange,
  onLinkPlan,
}: {
  plans: PlanListItem[];
  selectedPlanId: number | null;
  collectiviteId: number;
  onSelectedPlanIdChange: (planId: number | null) => void;
  onLinkPlan: () => void;
}) => (
  <ProgrammeActionsColumn>
    <div className="rounded-lg border border-grey-3 p-6 flex flex-col gap-4 bg-grey-1">
      <p className="text-sm font-medium text-grey-9 m-0">
        Rattacher un plan PCAET existant
      </p>
      <p className="text-sm text-grey-7 m-0">
        La collectivité peut déjà piloter son PCAET dans TET. Sélectionnez le
        plan à relier à cette démarche.
      </p>
      <div className="max-w-xl" data-test="demarche-plan-select">
        <Select
          options={plans.map((plan) => ({
            label: plan.nom ?? `Plan #${plan.id}`,
            value: plan.id,
          }))}
          values={selectedPlanId ?? undefined}
          onChange={(value) =>
            onSelectedPlanIdChange(value ? Number(value) : null)
          }
          placeholder="Sélectionner un plan PCAET"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="primary"
          size="sm"
          disabled={!selectedPlanId}
          onClick={onLinkPlan}
          data-test="demarche-link-plan"
        >
          Lier ce plan à la démarche
        </Button>
        <Button
          variant="outlined"
          size="sm"
          href={makeCreatePcaetPlanUrl(collectiviteId)}
          data-test="demarche-creer-plan-pcaet"
        >
          Créer un nouveau plan PCAET
        </Button>
      </div>
    </div>
  </ProgrammeActionsColumn>
);

export const ProgrammeActionsSection = ({
  demarche,
  onUpdateAction,
}: Props) => {
  const collectivite = useCurrentCollectivite();
  const { collectiviteId } = collectivite;

  const { plans, isLoading: isLoadingPlans } = useListPlans(collectiviteId, {
    limit: 20,
  });

  const pcaetPlans = useMemo(
    () => plans.filter((plan) => isPcaetPlan(plan.type?.type)),
    [plans]
  );

  const linkedPlan =
    pcaetPlans.find((p) => p.id === demarche.planActionId) ?? null;

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const effectiveSelectedPlanId =
    selectedPlanId ?? demarche.planActionId ?? pcaetPlans[0]?.id ?? null;

  const { fiches, isLoading: isLoadingFiches } = useListFiches(
    collectiviteId,
    linkedPlan
      ? {
          filters: { planActionIds: [linkedPlan.id] },
          queryOptions: { limit: 5 },
        }
      : undefined,
    Boolean(linkedPlan)
  );

  const linkSelectedPlan = () => {
    if (!effectiveSelectedPlanId) return;
    onUpdateAction({ planActionId: effectiveSelectedPlanId });
  };

  const renderContent = () => {
    if (isLoadingPlans) {
      return <ProgrammeActionsLoading />;
    }
    if (linkedPlan) {
      return (
        <ProgrammeActionsWithPlan
          collectivite={collectivite}
          plan={linkedPlan}
          fiches={fiches}
          isLoadingFiches={isLoadingFiches}
        />
      );
    }
    if (pcaetPlans.length > 0) {
      return (
        <ProgrammeActionsSelectPlan
          plans={pcaetPlans}
          collectiviteId={collectiviteId}
          selectedPlanId={effectiveSelectedPlanId}
          onSelectedPlanIdChange={setSelectedPlanId}
          onLinkPlan={linkSelectedPlan}
        />
      );
    }
    return <ProgrammeActionsNoPlan collectiviteId={collectiviteId} />;
  };

  const isNoPlan = !isLoadingPlans && !linkedPlan && pcaetPlans.length === 0;

  return (
    <DemarchePcaetSection
      title={isNoPlan ? undefined : "Compléter le plan d'actions"}
      description={isNoPlan ? undefined : "Résumé des dernières actions du plan PCAET — ouvrez le plan pour piloter l'ensemble du programme."}
    >
      {renderContent()}
    </DemarchePcaetSection>
  );
};
