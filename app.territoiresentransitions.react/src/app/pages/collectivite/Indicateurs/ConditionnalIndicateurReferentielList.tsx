import {useAllIndicateurDefinitionsForGroup} from 'core-logic/hooks/indicateur_definition';
import FuzzySearch from 'fuzzy-search';
import {useEffect, useState} from 'react';
import {ReferentielOfIndicateur} from 'types/litterals';
import {UiSearchBar} from 'ui/UiSearchBar';
import {IndicateurReferentielCard} from './IndicateurReferentielCard';

/**
 * Display the list of indicateurs for a given referentiel
 */
export const ConditionnalIndicateurReferentielList = (props: {
  referentiel: ReferentielOfIndicateur;
  showOnlyIndicateurWithData: boolean;
}) => {
  const indicateurDefinitions = useAllIndicateurDefinitionsForGroup(
    props.referentiel
  );
  const nomSearcher = new FuzzySearch(indicateurDefinitions, ['nom'], {
    sort: true,
  });
  const identifiantSearcher = new FuzzySearch(
    indicateurDefinitions,
    ['identifiant'],
    {
      sort: false,
    }
  );

  const [filteredIndicateurDefinitions, setFilteredIndicateurDefinitions] =
    useState(indicateurDefinitions);

  useEffect(
    () => setFilteredIndicateurDefinitions(indicateurDefinitions),
    [indicateurDefinitions]
  );
  const search = (query: string) => {
    if (query === '')
      return setFilteredIndicateurDefinitions(indicateurDefinitions);
    if (/^\d/.test(query))
      return setFilteredIndicateurDefinitions(
        identifiantSearcher.search(query)
      );

    return setFilteredIndicateurDefinitions(nomSearcher.search(query));
  };

  return (
    <div className="app mx-5 mt-5 ">
      <div className="-mt-44 float-right w-80">
        <UiSearchBar search={search} />
      </div>
      <section className="flex flex-col">
        {filteredIndicateurDefinitions.map(definition => {
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
