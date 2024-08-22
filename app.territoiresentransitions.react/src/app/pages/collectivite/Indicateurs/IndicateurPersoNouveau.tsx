import {useHistory} from 'react-router-dom';
import {IndicateurPersoNouveauForm} from 'app/pages/collectivite/Indicateurs/IndicateurPersoNouveauForm';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {
  TIndicateurPersoDefinitionWrite,
  useInsertIndicateurPersoDefinition,
} from './useInsertIndicateurPersoDefinition';
import {makeCollectiviteIndicateursUrl} from 'app/paths';
import {FicheAction} from '../PlansActions/FicheAction/data/types';

/** Affiche la page de création d'un indicateur personnalisé  */
const IndicateurPersoNouveau = ({
  fiche,
  onClose,
}: {
  /** Fiche action à laquelle rattacher le nouvel indicateur */
  fiche?: FicheAction;
  onClose?: () => void;
}) => {
  const collectiviteId = useCollectiviteId()!;
  const newDefinition = {
    collectiviteId,
    titre: '',
    description: '',
    unite: '',
    commentaire: '',
  };

  const history = useHistory();
  const ficheId = fiche?.id;

  const {mutate: save, isLoading} = useInsertIndicateurPersoDefinition({
    onSuccess: indicateurId => {
      // redirige vers la page de l'indicateur après la création
      const url = makeCollectiviteIndicateursUrl({
        collectiviteId,
        indicateurView: 'perso',
        indicateurId,
      });
      onClose?.();
      if (ficheId !== undefined) {
        window.open(url, '_blank');
      } else {
        history.push(url);
      }
    },
  });

  const onSave = (definition: TIndicateurPersoDefinitionWrite) => {
    save({definition, ficheId});
  };

  return (
    <IndicateurPersoNouveauForm
      indicateur={newDefinition}
      thematiquesFiche={fiche?.thematiques}
      isSaving={isLoading}
      onSave={onSave}
      onCancel={onClose ? onClose : () => history.goBack()}
    />
  );
};

export default IndicateurPersoNouveau;
