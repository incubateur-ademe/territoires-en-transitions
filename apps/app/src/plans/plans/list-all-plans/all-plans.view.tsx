'use client';
import { useIsVisitor } from '@/app/core-logic/hooks/permissions/useIsVisitor';
import { CreatePlanButton } from '@/app/plans/plans/create-plan/components/create-plan.button';
import { ImportPlanButton } from '@/app/plans/plans/import-plan/support';
import { EmptyAllPlansVisitorView } from '@/app/plans/plans/list-all-plans/empty-all-plans-visitor.view';
import { EmptyAllPlansView } from '@/app/plans/plans/list-all-plans/empty-all-plans.view';
import { useIsAuditeur } from '@/app/referentiels/audits/useAudit';
import { Plan } from '@/domain/plans/plans';
import { Spacer } from '@/ui';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';
import { Header } from '../components/header';
import { PlanCardWithFiltersList } from './plan-card-with-filters.list';

type Props = {
  plans: Plan[];
  collectiviteId: number;
  panierId: string | undefined;
};

export const AllPlansView = ({ plans, collectiviteId, panierId }: Props) => {
  const isVisitor = useIsVisitor();
  const isAuditeur = useIsAuditeur();
  return (
    <>
      <Header
        title="Tous les plans"
        actionButtons={
          <div className="flex gap-2">
            <VisibleWhen condition={plans.length !== 0}>
              <CreatePlanButton
                collectiviteId={collectiviteId}
                panierId={panierId}
              >
                {"Créer un plan d'action"}
              </CreatePlanButton>
            </VisibleWhen>
            <ImportPlanButton collectiviteId={collectiviteId} />
          </div>
        }
      />
      <VisibleWhen condition={plans.length === 0}>
        <Spacer height={3} />
        <div className="min-h-[60vh]">
          {isVisitor || isAuditeur ? (
            <EmptyAllPlansVisitorView />
          ) : (
            <EmptyAllPlansView
              collectiviteId={collectiviteId}
              panierId={panierId}
            />
          )}
        </div>
      </VisibleWhen>
      <VisibleWhen condition={plans.length !== 0}>
        <Spacer height={1} />
        <div className="min-h-[50vh]">
          <PlanCardWithFiltersList
            collectiviteId={collectiviteId}
            plans={plans}
          />
        </div>
      </VisibleWhen>
    </>
  );
};
