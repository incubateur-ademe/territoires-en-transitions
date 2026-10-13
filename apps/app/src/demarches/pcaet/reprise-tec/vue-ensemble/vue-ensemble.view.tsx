'use client';

import { repriseTecCasTypesUrl, repriseTecDecisionsUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { Button, PageHeader } from '@tet/ui';
import { useGetEntonnoir } from '../data/use-get-entonnoir';
import { RecetteChargement } from '../recette.chargement';
import { RegleLink } from '../regles/regle.link';
import { Entonnoir } from './entonnoir';

export const VueEnsembleView = () => {
  const { data, isLoading, error } = useGetEntonnoir();
  return (
    <div
      className="flex flex-col gap-6"
      data-test="admin.reprise-tec.vue-ensemble"
    >
      <PageHeader className="mb-0">
        <PageHeader.Title>{appLabels.repriseTecVueEnsemble}</PageHeader.Title>
        <PageHeader.Subtitle>
          <p className="mb-0 text-sm text-grey-8">
            {appLabels.repriseTecVueEnsembleSousTitre}
            <RegleLink numero={1} />
          </p>
        </PageHeader.Subtitle>
      </PageHeader>
      <RecetteChargement
        isLoading={isLoading}
        isPreconditionFailed={error?.data?.code === 'PRECONDITION_FAILED'}
      >
        {data && (
          <div className="rounded-lg border border-grey-3 bg-white p-6">
            <Entonnoir entonnoir={data} />
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <Button size="sm" variant="outlined" href={repriseTecCasTypesUrl}>
            {appLabels.repriseTecVoirCasTypes}
          </Button>
          <Button size="sm" variant="outlined" href={repriseTecDecisionsUrl}>
            {appLabels.repriseTecVoirDecisions}
          </Button>
        </div>
      </RecetteChargement>
    </div>
  );
};
