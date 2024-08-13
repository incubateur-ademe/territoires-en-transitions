import classNames from 'classnames';
import {useActionListe} from '../data/options/useActionListe';
import ActionCard from './ActionCard';

type ActionsLieesListeProps = {
  actionsIds: string[];
  isFicheTab?: boolean;
};

const ActionsLieesListe = ({
  actionsIds,
  isFicheTab = false,
}: ActionsLieesListeProps) => {
  const {data: actionListe} = useActionListe();

  const actionsLiees = (actionListe ?? []).filter(action =>
    actionsIds.some(id => id === action.action_id)
  );

  if (actionsLiees.length === 0) return null;

  return (
    // besoin de cette div car `grid` semble rentrer en conflit avec le container `flex` sur Safari
    <div>
      <div
        className={classNames('grid lg:grid-cols-2 xl:grid-cols-3 gap-3', {
          'sm:grid-cols-2 md:grid-cols-3': isFicheTab,
        })}
      >
        {actionsLiees.map(action => (
          <ActionCard key={action.action_id} action={action} openInNewTab />
        ))}
      </div>
    </div>
  );
};

export default ActionsLieesListe;
