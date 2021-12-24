import {indicateurDefinitionReadEndpoint} from 'core-logic/api/endpoints/IndicateurDefinitionReadEndpoint';
import {IndicateurDefinitionRead} from 'generated/dataLayer/indicateur_definition_read';
import {useEffect, useState} from 'react';

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
      .then(definitions => setIndicateurDefinitions(definitions));
  }, []);

  return indicateurDefinitions;
};
