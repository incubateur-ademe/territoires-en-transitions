import {useState} from 'react';
import FuzzySearch from 'fuzzy-search';
import {useAllIndicateurDefinitionsForGroup} from 'app/pages/collectivite/Indicateurs/useAllIndicateurDefinitions';
import {ReferentielOfIndicateur} from 'types/litterals';
import {UiSearchBar} from 'ui/UiSearchBar';
import {IndicateurReferentielCard} from './IndicateurReferentielCard';

/**
 * Affiche les indicateurs associés à un référentiel
 */
export const ConditionnalIndicateurReferentielList = (props: {
  referentiel: ReferentielOfIndicateur;
  showOnlyIndicateurWithData: boolean;
}) => {
  const search = useFuzzySearch(props.referentiel);
  const [query, setQuery] = useState('');
  const filteredIndicateurDefinitions = search(query);

  return (
    <div className="app mx-5 mt-5 ">
      <div className="-mt-44 float-right w-80">
        <UiSearchBar search={value => setQuery(value)} />
      </div>
      <section className="flex flex-col">
        {filteredIndicateurDefinitions?.map(definition => {
          return (
            <IndicateurReferentielCard
              definition={definition}
              key={definition.id}
              hideIfNoValues={props.showOnlyIndicateurWithData}
            />
          );
        })}
      </section>
    </div>
  );
};

// expose une fonction permettant de rechercher parmi les indicateurs associés à un référentiel
const useFuzzySearch = (referentiel: ReferentielOfIndicateur) => {
  const indicateurDefinitions =
    useAllIndicateurDefinitionsForGroup(referentiel);

  const search = (query: string) => {
    // liste sans filtrage
    if (query === '') {
      return indicateurDefinitions;
    }

    // recherche par identifiant
    if (/^\d/.test(query)) {
      const identifiantSearcher = new FuzzySearch(
        indicateurDefinitions,
        ['identifiant'],
        {
          sort: false,
        }
      );
      return identifiantSearcher.search(query);
    }

    // ou recherche par nom
    const nomSearcher = new FuzzySearch(indicateurDefinitions, ['nom'], {
      sort: false,
    });
    return nomSearcher.search(query);
  };

  return search;
};
