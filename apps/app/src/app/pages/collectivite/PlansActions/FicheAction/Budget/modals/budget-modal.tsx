import { useDeleteBudgets } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-delete-budgets';
import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-get-budget';
import { useUpsertBudgets } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-upsert-budgets';
import DetailledBudgetInput from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/modals/detailled-budget-input';
import ExtendedBudgetInput from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/modals/extended-budget-input';
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
import { ChangeEvent, useState } from 'react';

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

const getInitFullPlanState = (budgets: BudgetType[]) => {
  const filteredBudget = budgets.filter((elt) => !elt.annee);
  if (filteredBudget.length > 0) {
    return filteredBudget[0].estEtale;
  }
  return false;
};

const getTotalBudget = (
  budgets: BudgetType[],
  budgetType: 'previsionnel' | 'reel'
) => {
  const key =
    budgetType === 'previsionnel' ? 'budgetPrevisionnel' : 'budgetReel';

  return budgets
    .reduce(
      (sum: number, currValue: BudgetType) =>
        sum + parseInt(currValue[key] ?? '0'),
      0
    )
    .toString();
};

type BudgetModalProps = {
  openState: OpenState;
  fiche: FicheShareProperties;
  type: 'investissement' | 'fonctionnement';
  budgets: BudgetType[];
};

const BudgetModal = ({ openState, fiche, type, budgets }: BudgetModalProps) => {
  const ficheId = fiche.id;
  // Options avec checkbox
  const [isDetailled, setIsDetailled] = useState(!!budgets[0]?.annee);
  const [isEuros, setIsEuros] = useState(true);
  const [isFullPlan, setIsFullPlan] = useState(getInitFullPlanState(budgets));

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

  // Switch entre détaillé par année et budget total
  const handleSwitchDetailled = (evt: ChangeEvent<HTMLInputElement>) => {
    const newValue = evt.currentTarget.checked;
    setIsDetailled(newValue);

    if (newValue === false) {
      if (
        !euroExtendedBudget.budgetPrevisionnel &&
        !euroExtendedBudget.budgetReel
      ) {
        setEuroExtendedBudget({
          ...euroExtendedBudget,
          budgetPrevisionnel: getTotalBudget(
            euroDetailledBudget,
            'previsionnel'
          ),
          budgetReel: getTotalBudget(euroDetailledBudget, 'reel'),
        });
      }
      if (
        !etpExtendedBudget.budgetPrevisionnel &&
        !etpExtendedBudget.budgetReel
      ) {
        setEtpExtendedBudget({
          ...etpExtendedBudget,
          budgetPrevisionnel: getTotalBudget(
            etpDetailledBudget,
            'previsionnel'
          ),
          budgetReel: getTotalBudget(etpDetailledBudget, 'reel'),
        });
      }
    }
  };

  // Sauvegardes
  const { mutate: createBudgets } = useUpsertBudgets();
  const { mutate: deleteBudgets } = useDeleteBudgets();

  const handleSave = () => {
    const newBudgets: BudgetType[] = [];

    if (isDetailled) {
      newBudgets.push(...euroDetailledBudget, ...etpDetailledBudget);
    } else {
      if (
        euroExtendedBudget.budgetPrevisionnel ||
        euroExtendedBudget.budgetReel
      ) {
        newBudgets.push({ ...euroExtendedBudget, estEtale: isFullPlan });
      }
      if (
        etpExtendedBudget.budgetPrevisionnel ||
        etpExtendedBudget.budgetReel
      ) {
        newBudgets.push({ ...etpExtendedBudget, estEtale: isFullPlan });
      }
    }

    const budgetsToDelete = budgets.filter(
      (elt) => !newBudgets.find((b) => b.id === elt.id)
    );

    if (budgetsToDelete.length > 0) deleteBudgets(budgetsToDelete);
    if (newBudgets.length > 0) createBudgets(newBudgets);
  };

  return (
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
              onChange={handleSwitchDetailled}
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
                <ExtendedBudgetInput
                  key={isEuros ? 'euros' : 'etp'}
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
  );
};

export default BudgetModal;
