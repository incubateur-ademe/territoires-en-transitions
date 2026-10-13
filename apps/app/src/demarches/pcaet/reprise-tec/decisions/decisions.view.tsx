'use client';

import { appLabels } from '@/app/labels/catalog';
import { PageHeader } from '@tet/ui';
import { useListDecisions } from '../data/use-list-decisions';
import { RecetteChargement } from '../recette.chargement';
import { Decision } from './decision';

export const DecisionsView = () => {
  const { data, isLoading, error } = useListDecisions();
  return (
    <div
      className="flex flex-col gap-6"
      data-test="admin.reprise-tec.decisions"
    >
      <PageHeader className="mb-0">
        <PageHeader.Title>{appLabels.repriseTecDecisions}</PageHeader.Title>
        <PageHeader.Subtitle>
          <p className="mb-0 text-sm text-grey-8">
            {appLabels.repriseTecDecisionsSousTitre}
          </p>
        </PageHeader.Subtitle>
      </PageHeader>
      <RecetteChargement
        isLoading={isLoading}
        isPreconditionFailed={error?.data?.code === 'PRECONDITION_FAILED'}
      >
        {data &&
          [
            {
              titre: appLabels.repriseTecDecisionsOuvertes,
              liste: data.filter((d) => d.etat === 'ouverte'),
            },
            {
              titre: appLabels.repriseTecDecisionsPrises,
              liste: data.filter((d) => d.etat === 'prise'),
            },
          ].map(({ titre, liste }) => (
            <section key={titre} className="flex flex-col gap-3">
              <h2 className="mb-0 text-lg text-primary-9">{titre}</h2>
              {liste.map((d) => (
                <Decision key={d.code} decision={d} />
              ))}
            </section>
          ))}
      </RecetteChargement>
    </div>
  );
};
