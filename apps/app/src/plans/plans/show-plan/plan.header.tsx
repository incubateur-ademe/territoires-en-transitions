'use client';
import { Plan } from '@tet/domain/plans';
import { EditableTitle } from '../../fiches/show-fiche/header/editable-title';
import { PiloteOrReferentLabel } from '../components/PiloteOrReferentLabel';
import { useUpdatePlan } from './data/use-update-plan';
import { usePlanAxesContext } from './plan-arborescence.view/plan-axes.context';
import { PlanMenuButton } from './plan-menu.button';
import { PlanStatus } from './plan-status.chart';

export const PlanHeader = () => {
  const { plan, rootAxe, isReadOnly, updatePlan } = usePlanAxesContext();
  const { id, collectiviteId } = plan;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <EditableTitle
          className="text-2xl leading-10 my-0"
          containerClassName="mb-0"
          isReadonly={isReadOnly}
          title={rootAxe.nom}
          onUpdate={(value) => {
            updatePlan({ id, collectiviteId, nom: value });
          }}
        />
        <PlanMenuButton />
      </div>
      <div className="flex flex-col gap-2 grow">
        <PlanMetadata />
        <PlanStatus planId={plan.id} />
      </div>
    </div>
  );
};

const PlanMetadata = () => {
  const { plan, isReadOnly, updatePlan } = usePlanAxesContext();
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm uppercase text-grey-8 font-normal">
        {plan.type?.type || 'Sans type'}
      </span>
      {plan.pilotes.length > 0 && (
        <div className="border-l-2 border-gray-200 px-2">
          <PiloteOrReferentLabel icon="pilote" personnes={plan.pilotes} />
        </div>
      )}
      {plan.referents.length > 0 && (
        <div className="border-l-2 border-gray-200 px-2">
          <PiloteOrReferentLabel icon="france" personnes={plan.referents} />
        </div>
      )}
    </div>
  );
};
