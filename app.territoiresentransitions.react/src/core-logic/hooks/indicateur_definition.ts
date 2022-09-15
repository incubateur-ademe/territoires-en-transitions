import {indicateurDefinitionReadEndpoint} from 'core-logic/api/endpoints/IndicateurDefinitionReadEndpoint';
import {IndicateurDefinitionRead} from 'generated/dataLayer/indicateur_definition_read';
import {useEffect, useState} from 'react';
import {sortIndicateurDefinitionsByIdentifiant} from 'utils/indicateurs';

export const useAllIndicateurDefinitions = () => {
  const [indicateurDefinitions, setIndicateurDefinitions] = useState<
    IndicateurDefinitionRead[]
  >([]);

  useEffect(() => {
    indicateurDefinitionReadEndpoint
      .getBy({})
      .then(definitions => setIndicateurDefinitions(definitions));
  }, []);

  return indicateurDefinitions;
};

export const useAllIndicateurDefinitionsForGroup = (
  group: 'eci' | 'crte' | 'cae'
) => {
  const [indicateurDefinitions, setIndicateurDefinitions] = useState<
    IndicateurDefinitionRead[]
  >([]);

  useEffect(() => {
    indicateurDefinitionReadEndpoint
      .getBy({
        indicateur_group: group,
      })
      .then(definitions => {
        // TODO : sorting should be done in datalayer (using a view florian ?)
        const sortedDefinitions =
          sortIndicateurDefinitionsByIdentifiant(definitions);
        return setIndicateurDefinitions(sortedDefinitions);
      });
  }, [group]);

  return indicateurDefinitions;
};
