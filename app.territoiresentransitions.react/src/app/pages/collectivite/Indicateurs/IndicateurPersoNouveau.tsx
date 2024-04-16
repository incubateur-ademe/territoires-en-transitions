import {useHistory} from 'react-router-dom';
import {IndicateurPersoNouveauForm} from 'app/pages/collectivite/Indicateurs/IndicateurPersoNouveauForm';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {
  TIndicateurPersoDefinitionWrite,
  useUpsertIndicateurPersoDefinition,
} from './useUpsertIndicateurPersoDefinition';
import {makeCollectiviteIndicateursUrl} from 'app/paths';
import classNames from 'classnames';
import {TThematiqueRow} from 'types/alias';
import {FicheAction} from '../PlansActions/FicheAction/data/types';

/** Affiche la page de création d'un indicateur personnalisé  */
const IndicateurPersoNouveau = ({
  className,
  fiche,
  onClose,
}: {
  className?: string;
  /** Fiche action à laquelle rattacher le nouvel indicateur */
  fiche?: FicheAction;
  onClose?: () => void;
}) => {
  const collectiviteId = useCollectiviteId()!;
  const newDefinition = {
    collectivite_id: collectiviteId,
    titre: '',
    description: '',
    unite: '',
    commentaire: '',
  };

  const history = useHistory();
  const ficheId = fiche?.id;

  const {mutate: save, isLoading} = useUpsertIndicateurPersoDefinition({
    onSuccess: data => {
      // redirige vers la page de l'indicateur après la création
      const url = makeCollectiviteIndicateursUrl({
        collectiviteId,
        indicateurView: 'perso',
        indicateurId: data.id,
      });
      onClose?.();
      if (ficheId !== undefined) {
        window.open(url, '_blank');
      } else {
        history.push(url);
      }
    },
  });

  const onSave = (
    definition: TIndicateurPersoDefinitionWrite,
    thematiques: TThematiqueRow[]
  ) => {
    save({definition, ficheId, thematiques});
  };

  return (
    <div className={classNames('fr-p-2w', className)}>
      <h4>
        <i className="fr-icon-line-chart-line fr-pr-2w" />
        Créer un indicateur
      </h4>
      <IndicateurPersoNouveauForm
        indicateur={newDefinition}
        thematiquesFiche={fiche?.thematiques}
        isSaving={isLoading}
        onSave={onSave}
        onCancel={onClose ? onClose : () => history.goBack()}
      />
    </div>
  );
};

export default IndicateurPersoNouveau;
