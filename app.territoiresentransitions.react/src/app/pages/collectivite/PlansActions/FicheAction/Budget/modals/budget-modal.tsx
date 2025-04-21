import { useDeleteBudgets } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-delete-budgets';
import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-get-budget';
import { useUpsertBudgets } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-upsert-budgets';
import DetailledBudgetInput from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/modals/detailled-budget-input';
import YearlyBudgetInput from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/modals/yearly-budget-input';
import {
  Alert,
  ButtonGroup,
  Checkbox,
  Divider,
  Modal,
  ModalFooterOKCancel,
} from '@/ui';
import { OpenState } from '@/ui/utils/types';
import classNames from 'classnames';
import { useState } from 'react';

const getDefaultData = (
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

const getInitExtendedState = (
  budgets: BudgetType[],
  ficheId: number,
  type: 'investissement' | 'fonctionnement',
  unite: 'HT' | 'ETP'
) => {
  const filteredBudget = budgets.filter(
    (elt) => elt.unite === unite && !elt.annee
  );
  if (filteredBudget.length > 0) return filteredBudget[0];
  return getDefaultData(ficheId, type, unite);
};

type BudgetModalProps = {
  openState: OpenState;
  ficheId: number;
  type: 'investissement' | 'fonctionnement';
  budgets: BudgetType[];
};

const BudgetModal = ({
  openState,
  ficheId,
  type,
  budgets,
}: BudgetModalProps) => {
  // Options avec checkbox
  const [isDetailled, setIsDetailled] = useState(budgets[0]?.annee);
  const [isEuros, setIsEuros] = useState(true);

  // Budget en euros
  const [euroDetailledBudget, setEuroDetailledBudget] = useState(
    budgets.filter((elt) => elt.unite === 'HT' && !!elt.annee)
  );
  const [euroExtendedBudget, setEuroExtendedBudget] = useState(
    getInitExtendedState(budgets, ficheId, type, 'HT')
  );

  // Budget en ETP
  const [etpDetailledBudget, setEtpDetailledBudget] = useState(
    budgets.filter((elt) => elt.unite === 'ETP' && !!elt.annee)
  );
  const [etpExtendedBudget, setEtpExtendedBudget] = useState(
    getInitExtendedState(budgets, ficheId, type, 'ETP')
  );

  const { mutate: createBudget } = useUpsertBudgets();
  const { mutate: deleteBudget } = useDeleteBudgets();

  const handleSave = () => {
    if (isDetailled) {
      const budgetToDelete = budgets.filter(
        (elt) =>
          !euroDetailledBudget.find((b) => b.id === elt.id) &&
          !etpDetailledBudget.find((b) => b.id === elt.id)
      );

      budgetToDelete.forEach((elt) => deleteBudget({ budgetId: elt.id }));

      euroDetailledBudget.forEach((elt) => {
        createBudget(elt);
      });

      etpDetailledBudget.forEach((elt) => {
        createBudget(elt);
      });
    } else {
      const budgetToDelete = budgets.filter(
        (elt) =>
          euroExtendedBudget.id !== elt.id && etpExtendedBudget.id !== elt.id
      );

      budgetToDelete.forEach((elt) => deleteBudget({ budgetId: elt.id }));

      createBudget(euroExtendedBudget);
      createBudget(etpExtendedBudget);
    }
  };

  return (
    <Modal
      openState={openState}
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
              <DetailledBudgetInput
                {...{ ficheId, type }}
                unite={isEuros ? 'HT' : 'ETP'}
                budgets={isEuros ? euroDetailledBudget : etpDetailledBudget}
                onUpdate={(budgets) =>
                  isEuros
                    ? setEuroDetailledBudget(budgets)
                    : setEtpDetailledBudget(budgets)
                }
              />
            ) : (
              <>
                <YearlyBudgetInput
                  isEuros={isEuros}
                  budget={isEuros ? euroExtendedBudget : etpExtendedBudget}
                  onUpdate={(budget) =>
                    isEuros
                      ? setEuroExtendedBudget(budget)
                      : setEtpExtendedBudget(budget)
                  }
                />
                <Divider className="-mb-6" />
                <Checkbox
                  label="Le budget prévisionnel total renseigné s’étale sur toute la durée du plan d’action"
                  checked={
                    isEuros
                      ? euroExtendedBudget.estEtale
                      : etpExtendedBudget.estEtale
                  }
                  onChange={(evt) =>
                    isEuros
                      ? setEuroExtendedBudget({
                          ...euroExtendedBudget,
                          estEtale: evt.currentTarget.checked,
                        })
                      : setEtpExtendedBudget({
                          ...etpExtendedBudget,
                          estEtale: evt.currentTarget.checked,
                        })
                  }
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
  );
};

export default BudgetModal;
