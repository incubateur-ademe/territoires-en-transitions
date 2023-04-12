import {useCreateFicheAction} from '../FicheAction/data/useUpsertFicheAction';
import {useAddAxe} from './data/useUpsertAxe';

type Props = {
  axeId: number;
  planActionId: number;
};

export const AxeActions = ({axeId, planActionId}: Props) => {
  const {mutate: addAxe} = useAddAxe(axeId, planActionId);
  const {mutate: createFiche} = useCreateFicheAction({axeId, planActionId});

  return (
    <div className="flex items-center gap-6">
      <button
        data-test="AjouterAxe"
        className="fr-btn fr-btn--secondary"
        onClick={() => addAxe()}
      >
        Ajouter un nouveau titre
      </button>
      <button
        className="fr-btn fr-btn--secondary"
        onClick={() => createFiche()}
      >
        Créer une fiche action
      </button>
    </div>
  );
};
