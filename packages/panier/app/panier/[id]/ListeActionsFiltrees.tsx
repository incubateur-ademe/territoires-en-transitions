import {ActionImpactState} from '@tet/api';
import {ActionImpact} from '@tet/ui';

type ListeActionsFiltreesProps = {
  actionsListe: ActionImpactState[];
  onToggleSelected: (actionId: number, selected: boolean) => void;
  updateStatus: (actionId: number, statusId: string | null) => void;
};

const ListeActionsFiltrees = ({
  actionsListe,
  onToggleSelected,
  updateStatus,
}: ListeActionsFiltreesProps) => {
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {actionsListe.map(action => (
        <ActionImpact
          key={action.action.id}
          titre={action.action.titre}
          categorie={''}
          complexite={action.action.niveau_complexite as 1 | 2 | 3}
          budget={action.action.fourchette_budgetaire as 1 | 2 | 3}
          description={action.action.description}
          statut={
            action.statut?.categorie_id as
              | 'non_pertinent'
              | 'en_cours'
              | 'realise'
              | null
          }
          panier={action.isinpanier}
          isSelected={action.isinpanier}
          onToggleSelected={() =>
            onToggleSelected(action.action.id, !action.isinpanier)
          }
          onUpdateStatus={statut =>
            updateStatus(
              action.action.id,
              action.statut?.categorie_id === statut ? null : statut,
            )
          }
        />
      ))}
    </div>
  );
};

export default ListeActionsFiltrees;