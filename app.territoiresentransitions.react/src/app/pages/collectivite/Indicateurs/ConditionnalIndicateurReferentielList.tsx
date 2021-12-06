import {indicateurs} from 'generated/data/indicateurs_referentiels';
import {IndicateurReferentielCard} from './IndicateurReferentielCard';
import {ReferentielOfIndicateur} from 'types';
import {UiSearchBar} from 'ui/UiSearchBar';
import {useState} from 'react';
import FuzzySearch from 'fuzzy-search';

/**
 * Display the list of indicateurs for a given referentiel
 */
export const ConditionnalIndicateurReferentielList = (props: {
  referentiel: ReferentielOfIndicateur;
  showOnlyIndicateurWithData: boolean;
}) => {
  const referentielIndicateurs = indicateurs.filter(indicateur => {
    return indicateur.id.startsWith(props.referentiel);
  });

  const nomSearcher = new FuzzySearch(referentielIndicateurs, ['nom'], {
    sort: true,
  });
  const idSearcher = new FuzzySearch(referentielIndicateurs, ['id'], {
    sort: false,
  });

  const [filteredIndicateurs, setFilteredIndicateurs] = useState(
    referentielIndicateurs
  );

  const search = (query: string) => {
    if (query === '') return setFilteredIndicateurs(referentielIndicateurs);
    if (/^\d/.test(query))
      return setFilteredIndicateurs(idSearcher.search(query));

    return setFilteredIndicateurs(nomSearcher.search(query));
  };

  return (
    <div className="app mx-5 mt-5">
      <div className="float-right">
        <UiSearchBar search={search} />
      </div>
      <section className="flex flex-col">
        {filteredIndicateurs.map(indicateur => {
          return (
            <IndicateurReferentielCard
              indicateur={indicateur}
              key={indicateur.uid}
              hideIfNoValues={props.showOnlyIndicateurWithData}
            />
          );
        })}
      </section>
    </div>
  );
};
