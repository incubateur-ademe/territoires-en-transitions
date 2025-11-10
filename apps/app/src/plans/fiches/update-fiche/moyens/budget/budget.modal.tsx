import BaseUpdateFicheModal from '@/app/plans/fiches/update-fiche/base-update-fiche.modal';
import { FicheActionBudget, FicheResume } from '@/domain/plans';
import { ButtonGroup, Checkbox, Divider, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';
import { useDeleteBudgets } from '../../data/use-delete-budgets';
import { useUpsertBudgets } from '../../data/use-upsert-budgets';
import { DetailedBudgetForm } from './detailed-budget-form';
import { ExtendedBudgetForm } from './extended-budget-form';

const getDefaultBudgetData = (
  ficheId: number,
  type: 'investissement' | 'fonctionnement',
  unite: 'HT' | 'ETP'
): FicheActionBudget => {
  return {
    ficheId,
    type,
    unite,
    annee: undefined,
    budgetPrevisionnel: undefined,
    budgetReel: undefined,
    estEtale: undefined,
  };
};

const initExtendedBudgetFormData = (
  budgets: FicheActionBudget[],
  ficheId: number,
  type: 'investissement' | 'fonctionnement'
) => {
  const budgetReel = budgets.filter(
    (budget) => budget.unite === 'HT' && !budget.annee
  );
  const budgetPrevisionnel = budgets.filter(
    (budget) => budget.unite === 'ETP' && !budget.annee
  );

  return [
    ...(budgetPrevisionnel.length > 0
      ? budgetPrevisionnel
      : [getDefaultBudgetData(ficheId, type, 'ETP')]),
    ...(budgetReel.length > 0
      ? budgetReel
      : [getDefaultBudgetData(ficheId, type, 'HT')]),
  ];
};

const getInitFullPlanState = (budgets: FicheActionBudget[]) => {
  const filteredBudget = budgets.filter((budget) => !budget.annee);
  if (filteredBudget.length > 0) {
    return filteredBudget[0].estEtale;
  }
  return false;
};

type BudgetModalProps = {
  openState: OpenState;
  fiche: FicheResume;
  type: 'investissement' | 'fonctionnement';
  budgets: FicheActionBudget[];
};

export const BudgetModal = ({
  openState,
  fiche,
  type,
  budgets,
}: BudgetModalProps) => {
  const ficheId = fiche.id;
  const [isDetailled, setIsDetailled] = useState(!!budgets[0]?.annee);
  const [isEuros, setIsEuros] = useState(true);
  const [isFullPlan, setIsFullPlan] = useState(getInitFullPlanState(budgets));

  const [detailedBudgetDataForm, setDetailedBudgetDataForm] = useState<
    FicheActionBudget[]
  >(() => budgets.filter((budget) => !!budget.annee));
  const [extendedBudgetDataForm, setExtendedBudgetDataForm] = useState<
    FicheActionBudget[]
  >(() => initExtendedBudgetFormData(budgets, ficheId, type));

  const { mutate: createBudgets } = useUpsertBudgets();
  const { mutate: deleteBudgets } = useDeleteBudgets();

  const handleSave = () => {
    const newBudgets: FicheActionBudget[] = [];

    const budgetData = isDetailled
      ? detailedBudgetDataForm
      : extendedBudgetDataForm;

    const htBudgets = budgetData.filter((elt) => elt.unite === 'HT');
    const etpBudgets = budgetData.filter((elt) => elt.unite === 'ETP');

    if (isDetailled) {
      newBudgets.push(...htBudgets, ...etpBudgets);
    } else {
      newBudgets.push(
        ...htBudgets.map((elt) => ({ ...elt, estEtale: isFullPlan })),
        ...etpBudgets
          .filter((elt) => elt.unite === 'ETP')
          .map((elt) => ({ ...elt, estEtale: isFullPlan }))
      );
    }

    const budgetsToDelete = budgets.filter(
      (elt) => !newBudgets.find((b) => b.id === elt.id)
    );

    if (budgetsToDelete.length > 0) deleteBudgets(budgetsToDelete);
    if (newBudgets.length > 0) createBudgets(newBudgets);
  };

  return (
    <form className="flex flex-col gap-4">
      <BaseUpdateFicheModal
        openState={openState}
        fiche={fiche}
        title={
          type === 'investissement'
            ? "Budget d'investissement"
            : 'Budget de fonctionnement'
        }
        size="xl"
        render={() => (
          <div>
            <Divider className="pb-4" />

            {/* Options */}
            <div className="w-full flex max-sm:flex-col justify-between items-center gap-4">
              <Checkbox
                variant="switch"
                label="Détailler par année"
                checked={isDetailled}
                onChange={(evt) => setIsDetailled(evt.currentTarget.checked)}
              />
              <div className="max-sm:order-first">
                <ButtonGroup
                  buttons={[
                    {
                      id: 'etp',
                      children: 'Nombre d’ETP',
                      icon: 'user-line',
                      onClick: () => setIsEuros(false),
                    },
                    {
                      id: 'euro',
                      children: 'Euros',
                      icon: 'money-euro-circle-line',
                      onClick: () => setIsEuros(true),
                    },
                  ]}
                  size="xs"
                  activeButtonId={isEuros ? 'euro' : 'etp'}
                />
              </div>
            </div>
            <Divider className="mt-4" />

            {/* Formulaire */}
            <div className="flex flex-col gap-6">
              {isDetailled ? (
                <DetailedBudgetForm
                  budgets={detailedBudgetDataForm}
                  ficheId={ficheId}
                  type={type}
                  isEuros={isEuros}
                  onFormChange={setDetailedBudgetDataForm}
                />
              ) : (
                <>
                  <ExtendedBudgetForm
                    isEuros={isEuros}
                    budgets={extendedBudgetDataForm}
                    onFormChange={setExtendedBudgetDataForm}
                  />
                  <Divider className="-mb-6" />
                  <Checkbox
                    label="Le budget prévisionnel total renseigné s’étale sur toute la durée du plan d’action"
                    checked={isFullPlan}
                    onChange={(evt) => setIsFullPlan(evt.currentTarget.checked)}
                  />
                </>
              )}
              <Divider className="-mb-6" />
            </div>
          </div>
        )}
        renderFooter={({ close }) => (
          <ModalFooterOKCancel
            btnCancelProps={{ onClick: close }}
            btnOKProps={{
              onClick: () => {
                handleSave();
                close();
              },
            }}
          />
        )}
      />
    </form>
  );
};
