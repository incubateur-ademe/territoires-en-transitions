import {useEffect, useState} from 'react';
import {IndicateurPersonnaliseDefinitionRead} from 'generated/dataLayer/indicateur_personnalise_definition_read';
import {indicateurPersonnaliseDefinitionWriteEndpoint} from 'core-logic/api/endpoints/IndicateurPersonnaliseDefinitionWriteEndpoint';
import {indicateurPersonnaliseDefinitionRepository} from 'core-logic/api/repositories/IndicateurPersonnaliseDefinitionRepository';

export const useIndicateurPersonnaliseDefinitionList = (
  collectiviteId: number
) => {
  const [definitions, setDefinitions] = useState<
    IndicateurPersonnaliseDefinitionRead[]
  >([]);

  useEffect(() => {
    const fetch = async () => {
      const fetched =
        await indicateurPersonnaliseDefinitionRepository.fetchCollectiviteIndicateurPersonnaliseDefinitionList(
          {
            collectiviteId: collectiviteId,
          }
        );
      setDefinitions(fetched);
    };
    indicateurPersonnaliseDefinitionWriteEndpoint.addListener(fetch);
    fetch();
    return () => {
      indicateurPersonnaliseDefinitionWriteEndpoint.removeListener(fetch);
    };
  });

  return definitions;
};
