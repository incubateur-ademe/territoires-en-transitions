import {ActionImpact} from '@tet/api';

type PanierActionsProps = {
  actionsListe: ActionImpact[];
  onToggleSelected: (actionId: number, selected: boolean) => void;
};

const PanierActions = ({
  actionsListe,
  onToggleSelected,
}: PanierActionsProps) => {
  return (
    <div className="h-full bg-white border border-primary-3">
      <div className="p-4 flex flex-col gap-8">
        {actionsListe.map(action => (
          <div key={action.id} className="p-4 bg-primary-2">
            <div>{action.titre}</div>
            <div>{'€'.repeat(action.fourchette_budgetaire)}</div>
            <div>Complexité : {action.niveau_complexite}</div>
            <button onClick={() => onToggleSelected(action.id, false)}>
              Retirer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PanierActions;
