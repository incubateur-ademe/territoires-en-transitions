import {IndicateurPersonnaliseForm} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseForm';
import {indicateurPersonnaliseDefinitionRepository} from 'core-logic/api/repositories/IndicateurPersonnaliseDefinitionRepository';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {IndicateurPersonnaliseDefinitionWrite} from 'generated/dataLayer/indicateur_personnalise_definition_write';
import React from 'react';

export const IndicateurPersonnaliseCreator = (props: {onClose: () => void}) => {
  const collectiviteId = useCollectiviteId()!;
  const freshData = (): IndicateurPersonnaliseDefinitionWrite => {
    return {
      collectivite_id: collectiviteId,
      // identifiant: '',
      titre: '',
      description: '',
      unite: '',
      commentaire: '',
    };
  };
  const [data, setData] = React.useState<IndicateurPersonnaliseDefinitionWrite>(
    freshData()
  );

  const onSave = (definition: IndicateurPersonnaliseDefinitionWrite) => {
    indicateurPersonnaliseDefinitionRepository.save(definition);
    setData(freshData());
    props.onClose();
  };

  return <IndicateurPersonnaliseForm indicateur={data} onSave={onSave} />;
};
