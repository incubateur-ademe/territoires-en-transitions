'use client';
import { Plan } from '@tet/domain/plans';
import { EditableTitle } from '../../fiches/show-fiche/header/editable-title';
import { PiloteOrReferentLabel } from '../components/PiloteOrReferentLabel';
import { Actions } from './actions';
import { useUpdatePlan } from './data/use-update-plan';
import { usePlanAxesContext } from './plan-arborescence.view/plan-axes.context';
import { PlanStatus } from './plan-status.chart';

export const PlanHeader = () => {
  const { plan, rootAxe, canEditPlan, axeHasFiches } = usePlanAxesContext();
  const { id, collectiviteId } = plan;
  const { mutate: updatePlan } = useUpdatePlan({ collectiviteId });

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <EditableTitle
          className="text-2xl"
          containerClassName="mb-0"
          isReadonly={!canEditPlan}
          title={rootAxe.nom}
          onUpdate={(value) => {
            updatePlan({ id, collectiviteId, nom: value });
          }}
        />
        <div>
          <Actions plan={plan} axeHasFiches={axeHasFiches} />
        </div>
      </div>
      <div className="flex flex-col gap-2 grow">
        <PlanMetadata plan={plan} />
        <PlanStatus planId={plan.id} />
      </div>
    </div>
  );
};

const PlanMetadata = ({ plan }: { plan: Plan }) => {
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
