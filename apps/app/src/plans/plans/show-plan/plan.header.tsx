'use client';

import { PageHeader } from '@tet/ui';
import { usePlanAxesContext } from './plan-arborescence.view/plan-axes.context';
import { PlanMenuButton } from './plan-menu.button';
import { PlanMetadata } from './plan-metadata';
import { PlanStatus } from './plan-status.chart';

export const PlanHeader = () => {
  const { plan, rootAxe, isReadOnly, updatePlan } = usePlanAxesContext();
  const { id, collectiviteId } = plan;

  return (
    <PageHeader>
      <PageHeader.EditableTitle
        isReadonly={isReadOnly}
        title={rootAxe.nom}
        onUpdate={(value) => {
          updatePlan({ id, collectiviteId, nom: value });
        }}
      />
      <PageHeader.Actions>
        <PlanMenuButton />
      </PageHeader.Actions>
      <PageHeader.Metadata>
        <PlanMetadata
          plan={plan}
          isReadOnly={isReadOnly}
          updatePlan={updatePlan}
        />
        <PlanStatus planId={plan.id} />
      </PageHeader.Metadata>
    </PageHeader>
  );
};
