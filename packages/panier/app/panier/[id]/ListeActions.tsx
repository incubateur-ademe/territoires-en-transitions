import {ActionImpactCategorie, ActionImpactState} from '@tet/api';
import ListeActionsFiltrees from './ListeActionsFiltrees';

type ListeActionsProps = {
  actionsListe: ActionImpactState[];
  statuts: ActionImpactCategorie[];
  onToggleSelected: (actionId: number, selected: boolean) => void;
  updateStatus: (actionId: number, statusId: string | null) => void;
};

const ListeActions = ({
  actionsListe,
  statuts,
  onToggleSelected,
  updateStatus,
}: ListeActionsProps) => {
  console.log(actionsListe);

  return (
    <div className="my-4">
      <ListeActionsFiltrees
        actionsListe={actionsListe}
        statuts={statuts}
        updateStatus={updateStatus}
        onToggleSelected={onToggleSelected}
      />
    </div>
  );
};

export default ListeActions;
