'use client';

import { PageHeader } from '@tet/ui';
import { PlanSecteursButton } from '../secteurs-counts/plan-secteurs.button';
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
        <PlanSecteursButton collectiviteId={collectiviteId} planId={id} />
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
