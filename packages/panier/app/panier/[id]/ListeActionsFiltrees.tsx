import classNames from 'classnames';
import {ActionImpactCategorie, ActionImpactState} from '@tet/api';

type ListeActionsFiltreesProps = {
  actionsListe: ActionImpactState[];
  statuts: ActionImpactCategorie[];
  onToggleSelected: (actionId: number, selected: boolean) => void;
  updateStatus: (actionId: number, statusId: string | null) => void;
};

const ListeActionsFiltrees = ({
  actionsListe,
  statuts,
  onToggleSelected,
  updateStatus,
}: ListeActionsFiltreesProps) => {
  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {actionsListe.map(action => (
        <div
          key={action.action.id}
          className={classNames('p-4', {
            'bg-white': !action.isinpanier,
            'bg-primary-2': action.isinpanier,
          })}
        >
          <div>{action.action.titre}</div>
          <div>{'€'.repeat(action.action.fourchette_budgetaire)}</div>
          <div>Complexité : {action.action.niveau_complexite}</div>
          <div>
            Statut :{' '}
            {action.statut
              ? statuts.find(s => s.id === action.statut?.categorie_id)?.nom
              : ''}
          </div>
          <button
            onClick={() =>
              onToggleSelected(action.action.id, !action.isinpanier)
            }
          >
            {action.isinpanier ? 'Retirer' : 'Ajouter'}
          </button>

          <div className="flex gap-4">
            {statuts.map(s => (
              <button
                key={s.id}
                className={classNames({
                  'bg-primary-4': action.statut?.categorie_id === s.id,
                })}
                onClick={() =>
                  updateStatus(
                    action.action.id,
                    action.statut?.categorie_id === s.id ? null : s.id,
                  )
                }
              >
                {s.nom}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListeActionsFiltrees;
