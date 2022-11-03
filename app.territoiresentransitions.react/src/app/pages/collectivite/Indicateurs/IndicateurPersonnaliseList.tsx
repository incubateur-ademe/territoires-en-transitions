import {IndicateurPersonnaliseCard} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseCard';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useIndicateurPersonnaliseDefinitionList} from 'core-logic/hooks/indicateur_personnalise_definition';
import FuzzySearch from 'fuzzy-search';
import {IndicateurPersonnaliseDefinitionRead} from 'generated/dataLayer/indicateur_personnalise_definition_read';
import {useState} from 'react';
import {UiSearchBar} from 'ui/UiSearchBar';
import {IndicateurPersonnaliseCreationDialog} from './IndicateurPersonnaliseCreationDialog';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';

export const IndicateurPersonnaliseList = ({
  showOnlyIndicateurWithData = false,
}) => {
  const collectiviteId = useCollectiviteId()!;
  const currentCollectivite = useCurrentCollectivite();

  const [filteredIndicateurs, setFilteredIndicateurs] =
    useState<IndicateurPersonnaliseDefinitionRead[]>();

  const indicateurs = useIndicateurPersonnaliseDefinitionList(collectiviteId);

  indicateurs.sort((a, b) => a.titre.localeCompare(b.titre));

  const titreSearcher = new FuzzySearch(indicateurs, ['titre'], {
    sort: true,
  });

  const search = (query: string) => {
    if (query === '') return setFilteredIndicateurs(undefined);
    return setFilteredIndicateurs(titreSearcher.search(query));
  };

  return (
    <div className="app mx-5 mt-5">
      <div className="float-right -mt-48 w-80">
        <UiSearchBar search={search} />
      </div>
      <div className="float-right -mt-12">
        {currentCollectivite?.niveau_acces && (
          <IndicateurPersonnaliseCreationDialog />
        )}
      </div>
      <section className="flex flex-col">
        {(filteredIndicateurs || indicateurs).map(indicateur => (
          <IndicateurPersonnaliseCard
            indicateur={indicateur}
            key={indicateur.id}
            hideIfNoValues={showOnlyIndicateurWithData}
          />
        ))}
      </section>
    </div>
  );
};
