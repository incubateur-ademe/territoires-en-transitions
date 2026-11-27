'use client';

import { PlanNode } from '@tet/domain/plans';
import { AvancementParAxeBloc } from './avancement-par-axe/avancement-par-axe.bloc';
import { EvolutionStatutsBloc } from './evolution-statuts/evolution-statuts.bloc';
import { FaireAvancerLePlanBloc } from './faire-avancer-le-plan/faire-avancer-le-plan.bloc';
import { IndicateursObjectifsBloc } from './indicateurs-objectifs/indicateurs-objectifs.bloc';
import { useIsIndicateursObjectifsEnabled } from './indicateurs-objectifs/use-is-indicateurs-objectifs-enabled';
import { ModulesPersonnalisesBloc } from './modules-personnalises/modules-personnalises.bloc';
import { RenseignerAvancementSidePanel } from './faire-avancer-le-plan/renseigner-avancement.side-panel';
import { VueEnsembleBloc } from './vue-ensemble/vue-ensemble.bloc';

export const SuiviPlanView = ({
  collectiviteId,
  planId,
  dateDebutPlan,
  axes,
}: {
  collectiviteId: number;
  planId: number;
  dateDebutPlan: string;
  axes: PlanNode[];
}) => {
  const isIndicateursObjectifsEnabled = useIsIndicateursObjectifsEnabled();

  return (
    <div className="flex flex-col gap-6">
      <VueEnsembleBloc collectiviteId={collectiviteId} planId={planId} />
      <AvancementParAxeBloc collectiviteId={collectiviteId} planId={planId} />
      <EvolutionStatutsBloc
        collectiviteId={collectiviteId}
        planId={planId}
        dateDebutPlan={dateDebutPlan}
        axes={axes}
      />
      {isIndicateursObjectifsEnabled && (
        <IndicateursObjectifsBloc
          collectiviteId={collectiviteId}
          planId={planId}
          axes={axes}
        />
      )}
      <FaireAvancerLePlanBloc collectiviteId={collectiviteId} planId={planId} />
      <ModulesPersonnalisesBloc planId={planId} />
      <RenseignerAvancementSidePanel
        collectiviteId={collectiviteId}
        planId={planId}
      />
    </div>
  );
};
