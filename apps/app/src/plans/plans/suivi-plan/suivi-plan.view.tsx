'use client';

import { VueEnsembleBloc } from './vue-ensemble/vue-ensemble.bloc';

export const SuiviPlanView = ({
  collectiviteId,
  planId,
}: {
  collectiviteId: number;
  planId: number;
}) => (
  <div className="flex flex-col gap-6">
    <VueEnsembleBloc collectiviteId={collectiviteId} planId={planId} />
  </div>
);
