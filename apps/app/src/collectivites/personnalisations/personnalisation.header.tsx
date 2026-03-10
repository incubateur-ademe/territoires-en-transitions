'use client';

import { useCollectiviteId } from '@tet/api/collectivites';
import { useListPersonnalisationThematiques } from './data/use-list-personnalisation-thematiques';
import { PersonnalisationFilterBadges } from './filters/personnalisation-filter-badges';
import { PersonnalisationFiltersMenu } from './filters/personnalisation-filters.menu';
import { usePersonnalisationFilters } from './filters/personnalisation-filters-context';

const NbSuggestionLabel = {
  singular: 'suggestion de réponse provient',
  plural: 'suggestions de réponse proviennent',
};

export function PersonnalisationHeader() {
  const collectiviteId = useCollectiviteId();
  const { filters } = usePersonnalisationFilters();
  const { data } = useListPersonnalisationThematiques(collectiviteId, filters);
  const nbSuggestionsBanatic = data?.nbSuggestionsBanatic;

  return (
    <>
      <div className="flex justify-between items-center">
        <div className="font-normal text-primary-9">
          Les mesures et sous mesures proposées dans les référentiels dépendent
          des compétences et caractéristiques de chaque collectivité.
          {!!nbSuggestionsBanatic && (
            <>
              <br />
              <b>{nbSuggestionsBanatic}</b>&nbsp;
              {
                NbSuggestionLabel[
                  nbSuggestionsBanatic > 1 ? 'plural' : 'singular'
                ]
              }
              &nbsp;de Banatic.
            </>
          )}
        </div>
        <PersonnalisationFiltersMenu />
      </div>
      <hr className="mt-4 mb-2" />
      <PersonnalisationFilterBadges />
    </>
  );
}
