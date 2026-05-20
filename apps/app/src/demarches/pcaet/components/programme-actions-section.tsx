'use client';

import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { PCAET_PLAN_TYPE_LABEL } from '@/app/demarches/pcaet/demarche-pcaet.constants';
import type { DemarchePcaet } from '@/app/demarches/pcaet/demarche-pcaet.types';
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
import { Button } from '@tet/ui';
import Link from 'next/link';
import { ReactNode } from 'react';
import { makeCreatePcaetPlanUrl } from '../demarche-pcaet.constants';
import { DemarchePcaetSection } from './demarche-pcaet-section';

type Props = {
  demarche: DemarchePcaet;
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
    <div className="rounded-lg border border-dashed border-grey-4 p-6 flex flex-col gap-3">
      <p className="text-sm text-grey-7">
        Aucun plan de type « {PCAET_PLAN_TYPE_LABEL} » trouvé pour cette
        collectivité. Créez un plan pour afficher le programme d&apos;actions.
      </p>
      <Button
        variant="primary"
        size="sm"
        href={makeCreatePcaetPlanUrl(collectiviteId)}
        data-test="demarche-creer-plan-pcaet"
      >
        Créer le plan PCAET
      </Button>
    </div>
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

export const ProgrammeActionsSection = ({ demarche }: Props) => {
  const collectivite = useCurrentCollectivite();
  const { collectiviteId } = collectivite;

  const { plans, isLoading: isLoadingPlans } = useListPlans(collectiviteId, {
    limit: 20,
  });

  const pcaetPlan =
    plans.find((p) => p.id === demarche.planActionId) ??
    plans.find((p) => isPcaetPlan(p.type?.type));

  const { fiches, isLoading: isLoadingFiches } = useListFiches(
    collectiviteId,
    pcaetPlan
      ? {
          filters: { planActionIds: [pcaetPlan.id] },
          queryOptions: { limit: 5 },
        }
      : undefined,
    Boolean(pcaetPlan)
  );

  const renderContent = () => {
    if (isLoadingPlans) {
      return <ProgrammeActionsLoading />;
    }
    if (pcaetPlan) {
      return (
        <ProgrammeActionsWithPlan
          collectivite={collectivite}
          plan={pcaetPlan}
          fiches={fiches}
          isLoadingFiches={isLoadingFiches}
        />
      );
    }
    return <ProgrammeActionsNoPlan collectiviteId={collectiviteId} />;
  };

  return (
    <DemarchePcaetSection
      title="Compléter le plan d'actions"
      description="Résumé des dernières actions du plan PCAET — ouvrez le plan pour piloter l’ensemble du programme."
    >
      {renderContent()}
    </DemarchePcaetSection>
  );
};
