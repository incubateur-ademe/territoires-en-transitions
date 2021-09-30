import {IndicateurPersonnaliseStorable} from 'storables/IndicateurPersonnaliseStorable';
import {IndicateurPersonnaliseCreationDialog} from './IndicateurPersonnaliseCreationDialog';
import {useAllStorables} from 'core-logic/hooks';
import {indicateurPersonnaliseStore} from 'core-logic/api/hybridStores';
import {IndicateurPersonnaliseCard} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseCard';
import FuzzySearch from 'fuzzy-search';
import {useState} from 'react';
import {UiSearchBar} from 'ui/UiSearchBar';

export const IndicateurPersonnaliseList = ({
  showOnlyIndicateurWithData = false,
}) => {
  const [filteredIndicateurs, setFilteredIndicateurs] =
    useState<IndicateurPersonnaliseStorable[]>();

  const indicateurs = useAllStorables<IndicateurPersonnaliseStorable>(
    indicateurPersonnaliseStore
  );
  indicateurs.sort((a, b) => a.nom.localeCompare(b.nom));

  const nomSearcher = new FuzzySearch(indicateurs, ['nom'], {
    sort: true,
  });

  const search = (query: string) => {
    if (query === '') return setFilteredIndicateurs(undefined);
    return setFilteredIndicateurs(nomSearcher.search(query));
  };

  return (
    <div className="app mx-5 mt-5">
      <div className="float-right -mt-48">
        <UiSearchBar search={search} />
      </div>
      <div className="float-right -mt-12">
        <IndicateurPersonnaliseCreationDialog />
      </div>
      <section className="flex flex-col">
        {(filteredIndicateurs || indicateurs).map(indicateur => (
          <IndicateurPersonnaliseCard
            indicateur={indicateur}
            key={indicateur.uid}
            hideIfNoValues={showOnlyIndicateurWithData}
          />
        ))}
      </section>
    </div>
  );
};
