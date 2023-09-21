import {useParams} from 'react-router-dom';
import {useCreateFicheAction} from '../FicheAction/data/useUpsertFicheAction';
import {useAddAxe} from './data/useUpsertAxe';

type Props = {
  axeId: number;
  planActionId: number;
};

export const AxeActions = ({axeId, planActionId}: Props) => {
  const {axeUid} = useParams<{axeUid: string}>();

  const {mutate: addAxe} = useAddAxe(
    axeId,
    axeUid ? parseInt(axeUid) : planActionId
  );
  const {mutate: createFiche} = useCreateFicheAction({axeId, planActionId});

  return (
    <div className="flex items-center gap-6">
      <button
        data-test="AjouterAxe"
        className="fr-btn fr-btn--sm fr-btn--secondary"
        onClick={() => addAxe()}
      >
        Ajouter un nouveau titre
      </button>
      <button
        className="fr-btn fr-btn--sm fr-btn--primary"
        onClick={() => createFiche()}
      >
        Créer une fiche action
      </button>
    </div>
  );
};
