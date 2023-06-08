import FuzzySearch from 'fuzzy-search';
import {useAllIndicateurDefinitionsForGroup} from 'app/pages/collectivite/Indicateurs/useAllIndicateurDefinitions';
import {ReferentielOfIndicateur} from 'types/litterals';
import {IndicateurReferentielCard} from './IndicateurReferentielCard';

/**
 * Affiche les indicateurs associés à un référentiel
 */
export const ConditionnalIndicateurReferentielList = (props: {
  referentiel: ReferentielOfIndicateur;
  showOnlyIndicateurWithData: boolean;
  pattern: string;
}) => {
  const {referentiel, showOnlyIndicateurWithData, pattern} = props;
  const search = useFuzzySearch(referentiel);
  const filteredIndicateurDefinitions = search(pattern);

  return (
    <div className="app mx-5 mt-5 ">
      <section className="flex flex-col">
        {filteredIndicateurDefinitions?.map(definition => {
          return (
            <IndicateurReferentielCard
              definition={definition}
              key={definition.id}
              hideIfNoValues={showOnlyIndicateurWithData}
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
