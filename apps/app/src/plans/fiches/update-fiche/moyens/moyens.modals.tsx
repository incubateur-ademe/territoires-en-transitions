import {
  FicheActionBudget,
  FicheWithRelations,
  UpdateFicheRequest,
} from '@tet/domain/plans';
import { BudgetModal } from './budget/budget.modal';
import { FinancementsModal } from './financements/financements.modal';
import { FinanceursModal } from './financeurs/financeurs.modal';
import { ResourcesModal } from './ressources/resources.modal';

export type ModalType =
  | 'investissement'
  | 'fonctionnement'
  | 'financeurs'
  | 'financements'
  | 'resources'
  | null;

type MoyensModalsProps = {
  type: ModalType | null;
  onClose: () => void;
  fiche: FicheWithRelations;
  budgets: FicheActionBudget[];
  updateFiche: (params: {
    ficheId: number;
    ficheFields: UpdateFicheRequest;
  }) => void;
};

export const MoyensModals = ({
  type,
  onClose,
  fiche,
  budgets,
  updateFiche,
}: MoyensModalsProps) => {
  const openState = {
    isOpen: true,
    setIsOpen: (state: boolean) => !state && onClose(),
  };
  switch (type) {
    case 'investissement':
    case 'fonctionnement':
      return (
        <BudgetModal
          openState={openState}
          fiche={fiche}
          type={type}
          budgets={budgets.filter((elt) => elt.type === type)}
        />
      );
    case 'financeurs':
      return (
        <FinanceursModal
          openState={openState}
          fiche={fiche}
          updateFinanceurs={(financeurs) =>
            updateFiche({
              ficheId: fiche.id,
              ficheFields: { financeurs },
            })
          }
        />
      );
    case 'financements':
      return (
        <FinancementsModal
          openState={openState}
          fiche={fiche}
          updateFinancements={(financements) =>
            updateFiche({
              ficheId: fiche.id,
              ficheFields: { financements },
            })
          }
        />
      );
    case 'resources':
      return (
        <ResourcesModal
          openState={openState}
          fiche={fiche}
          updateResources={(ressources) =>
            updateFiche({
              ficheId: fiche.id,
              ficheFields: { ressources },
            })
          }
        />
      );
    default:
      return null;
  }
};
