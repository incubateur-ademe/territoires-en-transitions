'use client';

import {
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsCreerUrl,
  makeCollectivitePlansActionsImporterUrl,
} from '@/app/app/paths';
import {
  isPcaetPlan,
  PCAET_PLAN_TYPE_LABEL,
} from '@/app/demarches/pcaet/demarche-pcaet.constants';
import type { DemarchePcaetUpdatePatch } from '@/app/demarches/pcaet/demarche-pcaet.types';
import type { DemarchePcaet } from '@/app/demarches/pcaet/demarche-pcaet.types';
import { appLabels } from '@/app/labels/catalog';
import {
  PlanListItem,
  useListPlans,
} from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, cn, Icon, TableHeaderCell } from '@tet/ui';
import Link from 'next/link';
import { ReactNode, useMemo } from 'react';
import { DemarchePcaetSection } from './demarche-pcaet-section';

type Props = {
  demarche: DemarchePcaet;
  onUpdateAction: (patch: DemarchePcaetUpdatePatch) => void;
};

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
    <LoadingPlaceholder label={appLabels.demarchePcaetProgrammeChargement} />
  </ProgrammeActionsColumn>
);

const ProgrammeActionsPlanRow = ({
  plan,
  collectiviteId,
  isLinked,
  onLinkPlan,
  onUnlinkPlan,
}: {
  plan: PlanListItem;
  collectiviteId: number;
  isLinked: boolean;
  onLinkPlan: (planId: number) => void;
  onUnlinkPlan: () => void;
}) => {
  const planUrl = makePlanUrl(collectiviteId, plan.id);
  const nom =
    plan.nom ?? appLabels.demarchePcaetProgrammePlanParDefaut({ id: plan.id });

  return (
    <tr
      className={cn(
        'border-b border-grey-3 last:border-b-0',
        isLinked ? 'bg-primary-1' : 'even:bg-grey-1'
      )}
      data-test="demarche-plan-row"
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
        {plan.type?.type ?? PCAET_PLAN_TYPE_LABEL}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {isLinked ? (
            <>
              {/* <Button
                variant="outlined"
                size="sm"
                icon="external-link-line"
                href={planUrl}
                data-test="demarche-consulter-plan"
              >
                {appLabels.demarchePcaetProgrammeConsulterPlan}
              </Button> */}
              <Button
                variant="grey"
                size="sm"
                icon="link-unlink"
                onClick={onUnlinkPlan}
                className="text-error-1 hover:text-[#db4f4f]"
                dataTest="demarche-detacher-plan"
              >
                {appLabels.demarchePcaetProgrammeDetacher}
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon="link"
              onClick={() => onLinkPlan(plan.id)}
              dataTest="demarche-link-plan"
            >
              {appLabels.demarchePcaetProgrammeLierCePlan}
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

const ListPcaetPlansTable = ({
  plans,
  collectiviteId,
  linkedPlanId,
  onLinkPlan,
  onUnlinkPlan,
}: {
  plans: PlanListItem[];
  collectiviteId: number;
  linkedPlanId: number | null;
  onLinkPlan: (planId: number) => void;
  onUnlinkPlan: () => void;
}) => {
  const isPlanLinked = linkedPlanId !== null;
  const hasPlans = plans.length > 0;

  return (
    <ProgrammeActionsColumn>
      <ProgrammeActionsFrame>
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-grey-9 m-0">
            {appLabels.demarchePcaetProgrammeEtape1Titre}
          </p>
          <p className="text-grey-8 m-0">
            {hasPlans ? appLabels.demarchePcaetProgrammeEtape1Description : ''}
          </p>
        </div>
        <div
          className="w-full rounded-xl border border-grey-3 overflow-hidden"
          data-test="demarche-plan-table"
        >
          <table className="w-full border-collapse">
            <thead className="border-b border-grey-3">
              <tr>
                <TableHeaderCell
                  title={appLabels.demarchePcaetProgrammeColonneNom}
                  className="w-auto"
                />
                <TableHeaderCell
                  title={appLabels.demarchePcaetProgrammeColonneType}
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
                    onLinkPlan={onLinkPlan}
                    onUnlinkPlan={onUnlinkPlan}
                  />
                ))
              ) : (
                <tr data-test="demarche-plan-table-empty">
                  <td colSpan={3} className="px-4 py-10 text-center">
                    <p className="m-0 text-sm font-medium text-grey-8">
                      {appLabels.demarchePcaetProgrammeNoPlanIntro({
                        typeLabel: PCAET_PLAN_TYPE_LABEL,
                      })}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ProgrammeActionsFrame>
      <ProgrammeActionsFrame disabled={isPlanLinked}>
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-grey-9 m-0">
            {appLabels.demarchePcaetProgrammeEtape2Titre}
          </p>
          <p className="text-grey-8 m-0">
            {appLabels.demarchePcaetProgrammeEtape2Description}
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            size="sm"
            icon={<Icon icon="import-line" />}
            href={makeCollectivitePlansActionsImporterUrl({
              collectiviteId,
            })}
            disabled={isPlanLinked}
            dataTest="demarche-creer-plan-from-document"
          >
            {appLabels.demarchePcaetProgrammeCreerNouveauPlanFromDocument}
          </Button>
          <Button
            variant="outlined"
            size="sm"
            icon={<Icon icon="add-line" />}
            href={makeCollectivitePlansActionsCreerUrl({
              collectiviteId,
            })}
            disabled={isPlanLinked}
            dataTest="demarche-creer-plan-pcaet"
          >
            {appLabels.demarchePcaetProgrammeCreerNouveauPlanFromZero}
          </Button>
        </div>
      </ProgrammeActionsFrame>
    </ProgrammeActionsColumn>
  );
};

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

  const linkPlan = (planId: number) => {
    onUpdateAction({ planActionId: planId });
  };

  const unlinkPlan = () => {
    onUpdateAction({ planActionId: null });
  };

  const renderContent = () => {
    if (isLoadingPlans) {
      return <ProgrammeActionsLoading />;
    }
    return (
      <ListPcaetPlansTable
        plans={pcaetPlans}
        collectiviteId={collectiviteId}
        linkedPlanId={linkedPlan?.id ?? null}
        onLinkPlan={linkPlan}
        onUnlinkPlan={unlinkPlan}
      />
    );
  };

  return (
    <DemarchePcaetSection title={appLabels.demarchePcaetProgrammeTitre}>
      {renderContent()}
    </DemarchePcaetSection>
  );
};
