import {ActionImpact} from '@components/ActionImpact';
import {
  ActionImpactFourchetteBudgetaire,
  ActionImpactState,
  ActionImpactTempsMiseEnOeuvre,
} from '@tet/api';

type ListeActionsFiltreesProps = {
  actionsListe: ActionImpactState[];
  budgets: ActionImpactFourchetteBudgetaire[];
  temps: ActionImpactTempsMiseEnOeuvre[];
  onToggleSelected: (actionId: number, selected: boolean) => void;
  onUpdateStatus: (actionId: number, statusId: string | null) => void;
};

const ListeActionsFiltrees = ({
  actionsListe,
  budgets,
  temps,
  onToggleSelected,
  onUpdateStatus,
}: ListeActionsFiltreesProps) => {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
      {actionsListe.map(action => (
        <ActionImpact
          key={action.action.id}
          titre={action.action.titre}
          thematiques={action.thematiques}
          budget={budgets.find(
            b => b.niveau === action.action.fourchette_budgetaire,
          )}
          description={action.action.description}
          miseEnOeuvre={temps.find(
            t => t.niveau === action.action.temps_de_mise_en_oeuvre,
          )}
          ressources={action.action.ressources_externes}
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
            onUpdateStatus(
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
