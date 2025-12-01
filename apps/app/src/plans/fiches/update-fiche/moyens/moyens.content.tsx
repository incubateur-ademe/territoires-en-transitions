import { FicheActionBudget, FicheWithRelations } from '@/domain/plans';
import { Divider, Spacer } from '@/ui';
import { BudgetEditableView } from './budget/budget.editable-view';
import {
  shouldDisplayBudgetUnitWarning,
  shouldDisplayFinanceursUnitWarning,
} from './budget/utils';
import { UnitWarning } from './components/unit-warning';
import { FinancementsEditableView } from './financements/financements.editable-view';
import { FinanceursEditableView } from './financeurs/financeurs.editable-view';
import { ModalType } from './moyens.modals';
import { RessourcesEditableView } from './ressources/ressources.editable-view';

const Section = ({ children }: { children: React.ReactNode }) => (
  <div>
    <Divider />
    {children}
  </div>
);

type MoyensContentProps = {
  fiche: FicheWithRelations;
  budgets: FicheActionBudget[];
  isReadonly: boolean;
  onEdit: (modalType: ModalType) => void;
};

export const MoyensContent = ({
  fiche,
  budgets,
  isReadonly,
  onEdit,
}: MoyensContentProps) => {
  const isBudgetUnitWarningDisplayed = shouldDisplayBudgetUnitWarning(
    fiche,
    budgets
  );
  const isFinanceursUnitWarningDisplayed =
    shouldDisplayFinanceursUnitWarning(fiche);

  return (
    <div className="bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8 flex flex-col gap-6">
      <h5 className="text-primary-8 mb-0">Moyens</h5>
      <Section>
        <RessourcesEditableView
          fiche={fiche}
          isReadonly={isReadonly}
          onEdit={() => onEdit('resources')}
        />
      </Section>
      <Section>
        <BudgetEditableView
          budgets={budgets}
          type="investissement"
          isReadonly={isReadonly}
          onEdit={() => onEdit('investissement')}
        />
        <Spacer height={1} />
        <BudgetEditableView
          type="fonctionnement"
          isReadonly={isReadonly}
          budgets={budgets}
          onEdit={() => onEdit('fonctionnement')}
        />
      </Section>
      {isBudgetUnitWarningDisplayed && <UnitWarning />}
      <Section>
        <FinanceursEditableView
          fiche={fiche}
          onEdit={() => onEdit('financeurs')}
          isReadonly={isReadonly}
        />
      </Section>
      {isFinanceursUnitWarningDisplayed && <UnitWarning />}
      <Section>
        <FinancementsEditableView
          fiche={fiche}
          onEdit={() => onEdit('financements')}
          isReadonly={isReadonly}
        />
      </Section>
    </div>
  );
};
