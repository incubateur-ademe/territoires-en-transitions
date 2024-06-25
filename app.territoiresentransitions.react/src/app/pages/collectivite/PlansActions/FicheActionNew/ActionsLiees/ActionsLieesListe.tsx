import {useActionListe} from '../../FicheAction/data/options/useActionListe';
import ActionCard from '../Cartes/ActionCard';

type ActionsLieesListeProps = {
  actionsIds: string[];
};

const ActionsLieesListe = ({actionsIds}: ActionsLieesListeProps) => {
  const {data: actionListe} = useActionListe();

  const actionsLiees = (actionListe ?? []).filter(action =>
    actionsIds.some(id => id === action.action_id)
  );

  return (
    actionsLiees.length > 0 && (
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {actionsLiees.map(action => (
          <ActionCard key={action.action_id} action={action} openInNewTab />
        ))}
      </div>
    )
  );
};

export default ActionsLieesListe;
