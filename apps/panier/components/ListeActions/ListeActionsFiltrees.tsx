import {
  ActionImpactFourchetteBudgetaire,
  ActionImpactFull,
  ActionImpactTempsMiseEnOeuvre,
} from '@/api';
import { ActionImpact } from '@/panier/components/ActionImpact';

type ListeActionsFiltreesProps = {
  actionsListe: ActionImpactFull[];
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
      {actionsListe.map((action) => (
        <ActionImpact
          key={action.id}
          actionsLiees={action.actions_liees}
          titre={action.titre}
          thematiques={action.thematiques}
          typologie={action.typologie}
          budget={budgets.find(
            (b) => b.niveau === action.fourchette_budgetaire?.niveau
          )}
          description={`${action.description}\n\n${action.description_complementaire}`}
          miseEnOeuvre={temps.find(
            (t) => t.niveau === action.temps_de_mise_en_oeuvre?.niveau
          )}
          ressources={action.ressources_externes ?? []}
          rex={action.rex ?? []}
          subventions={action.subventions_mobilisables ?? []}
          statut={action.statut}
          panier={action.isinpanier ?? false}
          isSelected={action.isinpanier}
          onToggleSelected={() =>
            onToggleSelected(action.id, !action.isinpanier)
          }
          onUpdateStatus={(statut) =>
            onUpdateStatus(action.id, action.statut === statut ? null : statut)
          }
        />
      ))}
    </div>
  );
};

export default ListeActionsFiltrees;
