import {useHistory} from 'react-router-dom';
import {IndicateurPersonnaliseForm} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseForm';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {
  TIndicateurPersoDefinitionWrite,
  useUpsertIndicateurPersoDefinition,
} from './useUpsertIndicateurPersoDefinition';
import {makeCollectiviteIndicateursUrl} from 'app/paths';

export const IndicateurPersonnaliseCreator = (props: {onClose: () => void}) => {
  const collectiviteId = useCollectiviteId()!;
  const newDefinition = {
    collectivite_id: collectiviteId,
    titre: '',
    description: '',
    unite: '',
    commentaire: '',
  };

  const {mutate: save} = useUpsertIndicateurPersoDefinition();
  const history = useHistory();

  const onSave = (definition: TIndicateurPersoDefinitionWrite) => {
    save(definition, {
      onSuccess: () => {
        // redirige vers la page des indicateurs perso après la création
        const url = makeCollectiviteIndicateursUrl({
          collectiviteId,
          indicateurView: 'perso',
        });
        if (history.location.pathname !== url) {
          history.push(url);
        }
      },
    });
    props.onClose();
  };

  return (
    <IndicateurPersonnaliseForm indicateur={newDefinition} onSave={onSave} />
  );
};
