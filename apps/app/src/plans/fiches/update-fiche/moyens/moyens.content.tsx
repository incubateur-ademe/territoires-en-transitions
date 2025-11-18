import { FicheActionBudget, FicheWithRelations } from '@/domain/plans';
import { Divider, Spacer } from '@/ui';
import { BudgetUnitWarning } from './budget/budget-unit-warning';
import { BudgetEditableView } from './budget/budget.editable-view';
import { shouldDisplayUnitWarning } from './budget/utils';
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
  const shouldDisplayWarning = shouldDisplayUnitWarning(fiche, budgets);
  return (
    <div className="bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8 flex flex-col gap-6">
      <h5 className="text-primary-8 mb-0">Moyens</h5>

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
      {shouldDisplayWarning && <BudgetUnitWarning />}
      <Section>
        <FinanceursEditableView
          fiche={fiche}
          onEdit={() => onEdit('financeurs')}
          isReadonly={isReadonly}
        />
      </Section>

      <Section>
        <FinancementsEditableView
          fiche={fiche}
          onEdit={() => onEdit('financements')}
          isReadonly={isReadonly}
        />
      </Section>
      <Section>
        <RessourcesEditableView
          fiche={fiche}
          isReadonly={isReadonly}
          onEdit={() => onEdit('resources')}
        />
      </Section>
    </div>
  );
};
