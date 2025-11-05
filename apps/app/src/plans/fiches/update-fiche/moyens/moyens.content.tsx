import { FicheActionBudget, FicheWithRelations } from '@/domain/plans';
import { Divider } from '@/ui';
import { Budget } from './budget/budget';
import { Financements } from './financements/financements';
import { Financeurs } from './financeurs/financeurs.view';
import { ModalType } from './moyens.modals';
import { Moyens } from './ressources/ressources.view';

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
}: MoyensContentProps) => (
  <div className="bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8 flex flex-col gap-5">
    <h5 className="text-primary-8 mb-0">Moyens</h5>

    <Section>
      <Budget
        budgets={budgets}
        type="investissement"
        isReadonly={isReadonly}
        onEdit={() => onEdit('investissement')}
      />
    </Section>

    <Section>
      <Budget
        type="fonctionnement"
        isReadonly={isReadonly}
        budgets={budgets}
        onEdit={() => onEdit('fonctionnement')}
      />
    </Section>

    <Section>
      <Financeurs
        fiche={fiche}
        onEdit={() => onEdit('financeurs')}
        isReadonly={isReadonly}
      />
    </Section>

    <Section>
      <Financements
        fiche={fiche}
        onEdit={() => onEdit('financements')}
        isReadonly={isReadonly}
      />
    </Section>
    <Section>
      <Moyens
        fiche={fiche}
        isReadonly={isReadonly}
        onEdit={() => onEdit('resources')}
      />
    </Section>
  </div>
);
