import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/BudgetTab';
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

const getInitDetailledState = (
  budget: BudgetType[],
  ficheId: number,
  type: 'investissement' | 'fonctionnement',
  unite: 'HT' | 'ETP'
) => {
  const filteredBudget = budget.filter(
    (elt) => elt.unite === unite && !elt.annee
  );
  if (filteredBudget.length > 0) return filteredBudget[0];
  return getDefaultData(ficheId, type, unite);
};

type BudgetModalProps = {
  openState: OpenState;
  ficheId: number;
  type: 'investissement' | 'fonctionnement';
  budget: BudgetType[];
};

const BudgetModal = ({
  openState,
  ficheId,
  type,
  budget,
}: BudgetModalProps) => {
  // Options avec checkbox
  const [isDetailled, setIsDetailled] = useState(true);
  const [isEuros, setIsEuros] = useState(true);

  // Budget en euros
  const [euroDetailledBudget, setEuroDetailledBudget] = useState(
    budget.filter((elt) => elt.unite === 'HT' && !!elt.annee)
  );
  const [euroExtendedBudget, setEuroExtendedBudget] = useState(
    getInitDetailledState(budget, ficheId, type, 'HT')
  );

  // Budget en ETP
  const [etpDetailledBudget, setEtpDetailledBudget] = useState(
    budget.filter((elt) => elt.unite === 'ETP' && !!elt.annee)
  );
  const [etpExtendedBudget, setEtpExtendedBudget] = useState(
    getInitDetailledState(budget, ficheId, type, 'ETP')
  );

  const handleSave = () => {
    //
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
                isEuros={isEuros}
                budgets={isEuros ? euroDetailledBudget : etpDetailledBudget}
              />
            ) : (
              <>
                <YearlyBudgetInput
                  isEuros={isEuros}
                  budget={isEuros ? euroExtendedBudget : etpExtendedBudget}
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
