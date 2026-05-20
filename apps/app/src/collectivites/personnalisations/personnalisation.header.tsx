'use client';

import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useListPersonnalisationThematiques } from './data/use-list-personnalisation-thematiques';
import { PersonnalisationFilterBadges } from './filters/personnalisation-filter-badges';
import { PersonnalisationFiltersMenu } from './filters/personnalisation-filters.menu';
import { usePersonnalisationFilters } from './filters/personnalisation-filters-context';

export function PersonnalisationHeader() {
  const collectiviteId = useCollectiviteId();
  const { filters } = usePersonnalisationFilters();
  const { data } = useListPersonnalisationThematiques(collectiviteId, filters);
  const nbSuggestionsBanatic = data?.nbSuggestionsBanatic;

  return (
    <>
      <div className="flex justify-between items-center">
        <div className="font-normal text-primary-9">
          {appLabels.personnalisationHeaderTexte}
          {!!nbSuggestionsBanatic && (
            <>
              <br />
              <b>{nbSuggestionsBanatic}</b>&nbsp;
              {appLabels.nbSuggestionReponseProvient({
                count: nbSuggestionsBanatic,
              })}
              &nbsp;{appLabels.deBanatic}
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
