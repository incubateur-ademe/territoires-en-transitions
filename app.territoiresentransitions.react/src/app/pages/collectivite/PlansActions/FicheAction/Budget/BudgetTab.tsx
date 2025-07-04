import Budget from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/content/budget';
import Financements from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/content/financements';
import Financeurs from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/content/financeurs';
import { useGetBudget } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-get-budget';
import BudgetModal from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/modals/budget-modal';
import FinancementsModal from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/modals/financements-modal';
import FinanceursModal from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/modals/financeurs-modal';
import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { useUpdateFiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-update-fiche';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Divider, EmptyCard } from '@/ui';
import { useState } from 'react';
import MoneyPicto from './MoneyPicto';

export type BudgetType = {
  id?: number;
  ficheId: number;
  type: 'investissement' | 'fonctionnement';
  unite: 'HT' | 'ETP';
  annee?: number;
  budgetPrevisionnel?: string;
  budgetReel?: string;
  estEtale?: boolean;
};

type BudgetTabProps = {
  isReadonly: boolean;
  fiche: Fiche;
};

const BudgetTab = ({ isReadonly, fiche }: BudgetTabProps) => {
  const [isInvestissementModalOpen, setIsInvestissementModalOpen] =
    useState(false);
  const [isFonctionnementModalOpen, setIsFonctionnementModalOpen] =
    useState(false);
  const [isFinanceursModalOpen, setIsFinanceursModalOpen] = useState(false);
  const [isFinancementsModalOpen, setIsFinancementsModalOpen] = useState(false);

  const { mutate: updateFiche } = useUpdateFiche();

  const { financeurs, financements } = fiche;

  /**
   * TODO: not supposed to load budget again, already loaded in fiche
   */
  const { data: budget, isLoading: isBudgetLoading } = useGetBudget({
    ficheId: fiche.id,
  });

  if (isBudgetLoading) {
    return <SpinnerLoader className="mx-auto my-8" />;
  }

  const isEmpty =
    !isBudgetLoading &&
    !!budget &&
    budget.length === 0 &&
    (!financeurs || financeurs.length === 0) &&
    !financements;

  return (
    <>
      {isEmpty ? (
        <EmptyCard
          picto={(props) => <MoneyPicto {...props} />}
          title="Budget : montants prévisionnels et dépensés !"
          isReadonly={isReadonly}
          actions={[
            {
              children: 'Compléter le budget d’investissement',
              onClick: () => setIsInvestissementModalOpen(true),
            },
            {
              children: 'Compléter le budget de fonctionnement',
              onClick: () => setIsFonctionnementModalOpen(true),
            },
            {
              children: 'Ajouter des financeurs',
              variant: 'outlined',
              onClick: () => setIsFinanceursModalOpen(true),
            },
            {
              children: 'Détailler les financements',
              variant: 'outlined',
              onClick: () => setIsFinancementsModalOpen(true),
            },
          ]}
          size="xs"
        />
      ) : (
        <div className="bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8 flex flex-col gap-5">
          {/* Titre */}
          <h5 className="text-primary-8 mb-0">Budget</h5>

          {/* Budget d'investissement */}
          <div>
            <Divider />
            <Budget
              fiche={fiche}
              budgets={budget}
              type="investissement"
              isReadonly={isReadonly}
            />
          </div>

          {/* Budget de fonctionnement */}
          <div>
            <Divider />
            <Budget
              fiche={fiche}
              budgets={budget}
              type="fonctionnement"
              isReadonly={isReadonly}
            />
          </div>

          {/* Financeurs */}
          <div>
            <Divider />
            <Financeurs
              fiche={fiche}
              updateFinanceurs={(financeurs) =>
                updateFiche({
                  ficheId: fiche.id,
                  ficheFields: { financeurs },
                })
              }
              isReadonly={isReadonly}
            />
          </div>

          {/* Financements */}
          <div>
            <Divider />
            <Financements
              fiche={fiche}
              updateFinancements={(financements) =>
                updateFiche({
                  ficheId: fiche.id,
                  ficheFields: { financements },
                })
              }
              isReadonly={isReadonly}
            />
          </div>
        </div>
      )}

      {/* Modales */}
      {(isInvestissementModalOpen || isFonctionnementModalOpen) && (
        <BudgetModal
          openState={{
            isOpen: isInvestissementModalOpen || isFonctionnementModalOpen,
            setIsOpen: (state) => {
              setIsInvestissementModalOpen(state);
              setIsFonctionnementModalOpen(state);
            },
          }}
          fiche={fiche}
          type={isInvestissementModalOpen ? 'investissement' : 'fonctionnement'}
          budgets={(budget as BudgetType[]).filter(
            (elt) =>
              elt.type ===
              (isInvestissementModalOpen ? 'investissement' : 'fonctionnement')
          )}
        />
      )}

      {isFinanceursModalOpen && (
        <FinanceursModal
          openState={{
            isOpen: isFinanceursModalOpen,
            setIsOpen: setIsFinanceursModalOpen,
          }}
          fiche={fiche}
          updateFinanceurs={(financeurs) =>
            updateFiche({
              ficheId: fiche.id,
              ficheFields: { financeurs },
            })
          }
        />
      )}

      {isFinancementsModalOpen && (
        <FinancementsModal
          openState={{
            isOpen: isFinancementsModalOpen,
            setIsOpen: setIsFinancementsModalOpen,
          }}
          fiche={fiche}
          updateFinancements={(financements) =>
            updateFiche({
              ficheId: fiche.id,
              ficheFields: { financements },
            })
          }
        />
      )}
    </>
  );
};

export default BudgetTab;
