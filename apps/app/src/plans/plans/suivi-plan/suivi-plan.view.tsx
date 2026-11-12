'use client';

import { AvancementParAxeBloc } from './avancement-par-axe/avancement-par-axe.bloc';
import { EvolutionStatutsBloc } from './evolution-statuts/evolution-statuts.bloc';
import { FaireAvancerLePlanBloc } from './faire-avancer-le-plan/faire-avancer-le-plan.bloc';
import { VueEnsembleBloc } from './vue-ensemble/vue-ensemble.bloc';

export const SuiviPlanView = ({
  collectiviteId,
  planId,
  dateDebutPlan,
}: {
  collectiviteId: number;
  planId: number;
  dateDebutPlan: string;
}) => (
  <div className="flex flex-col gap-6">
    <VueEnsembleBloc collectiviteId={collectiviteId} planId={planId} />
    <AvancementParAxeBloc planId={planId} />
    <EvolutionStatutsBloc
      collectiviteId={collectiviteId}
      planId={planId}
      dateDebutPlan={dateDebutPlan}
    />
    <FaireAvancerLePlanBloc collectiviteId={collectiviteId} planId={planId} />
  </div>
);
