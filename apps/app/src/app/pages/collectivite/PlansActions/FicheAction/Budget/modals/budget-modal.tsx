import { useDeleteBudgets } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-delete-budgets';
import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-get-budget';
import { useUpsertBudgets } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-upsert-budgets';
import { ExtendedBudgetForm } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/modals/extended-budget-form';
import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import BaseUpdateFicheModal from '@/app/plans/fiches/update-fiche/base-update-fiche.modal';
import {
  Alert,
  ButtonGroup,
  Checkbox,
  Divider,
  ModalFooterOKCancel,
} from '@/ui';
import { OpenState } from '@/ui/utils/types';
import classNames from 'classnames';
import { useState } from 'react';
import { DetailedBudgetForm } from './detailed-budget-form';

const getDefaultBudgetData = (
  ficheId: number,
  type: 'investissement' | 'fonctionnement',
  unite: 'HT' | 'ETP'
) => {
  return {
    ficheId,
    type,
    unite,
    annee: undefined,
    budgetPrevisionnel: undefined,
    budgetReel: undefined,
    estEtale: undefined,
  } as BudgetType;
};

const initExtendedBudgetFormData = (
  budgets: BudgetType[],
  ficheId: number,
  type: 'investissement' | 'fonctionnement'
) => {
  const budgetReel = budgets.filter((elt) => elt.unite === 'HT' && !elt.annee);
  const budgetPrevisionnel = budgets.filter(
    (elt) => elt.unite === 'ETP' && !elt.annee
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

const getInitFullPlanState = (budgets: BudgetType[]) => {
  const filteredBudget = budgets.filter((elt) => !elt.annee);
  if (filteredBudget.length > 0) {
    return filteredBudget[0].estEtale;
  }
  return false;
};

type BudgetModalProps = {
  openState: OpenState;
  fiche: FicheShareProperties;
  type: 'investissement' | 'fonctionnement';
  budgets: BudgetType[];
};

export const BudgetModal = ({
  openState,
  fiche,
  type,
  budgets,
}: BudgetModalProps) => {
  const ficheId = fiche.id;
  // Options avec checkbox
  const [isDetailled, setIsDetailled] = useState(!!budgets[0]?.annee);
  const [isEuros, setIsEuros] = useState(true);
  const [isFullPlan, setIsFullPlan] = useState(getInitFullPlanState(budgets));

  const [detailedBudgetDataForm, setDetailedBudgetDataForm] = useState<
    BudgetType[]
  >(() => budgets.filter((elt) => !!elt.annee));
  const [extendedBudgetDataForm, setExtendedBudgetDataForm] = useState<
    BudgetType[]
  >(() => initExtendedBudgetFormData(budgets, ficheId, type));

  // Sauvegardes
  const { mutate: createBudgets } = useUpsertBudgets();
  const { mutate: deleteBudgets } = useDeleteBudgets();

  const handleSave = () => {
    const newBudgets: BudgetType[] = [];

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
              <Alert
                state="warning"
                title="Ce champ historiquement en TTC est passé en HT, veillez à vérifier vos valeurs et à les modifier le cas échéant. N’hésitez pas à contacter le support si vous avez besoin d’aide pour faire les conversions."
                rounded
                withBorder
                className={classNames({ hidden: !isEuros })}
              />

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
