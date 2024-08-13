import {useActionListe} from '../data/options/useActionListe';
import ActionCard from './ActionCard';

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
      // besoin de cette div car `grid` semble rentrer en conflit avec le container `flex` sur Safari
      <div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {actionsLiees.map(action => (
            <ActionCard key={action.action_id} action={action} openInNewTab />
          ))}
        </div>
      </div>
    )
  );
};

export default ActionsLieesListe;
