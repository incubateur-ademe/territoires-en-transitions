import { BudgetType } from '@tet/domain/plans';
import { EmptyCardProps } from '@tet/ui';

import { FinanceursPicto } from './financeurs.picto';
import { FonctionnementPicto } from './fonctionnement.picto';
import { InvestmentPicto } from './investissement.picto';

export const emptyViewsProps: Record<
  BudgetType | 'financeurs',
  {
    title: string;
    actionButton: string;
    picto: EmptyCardProps['picto'];
    className?: string;
  }
> = {
  investissement: {
    className: 'h-72 min-h-0',
    title: "Budget d'investissement",
    actionButton: "Compléter le budget d'investissement",
    picto: (props) => <InvestmentPicto {...props} />,
  },
  fonctionnement: {
    className: 'h-72 min-h-0',
    title: 'Budget de fonctionnement',
    actionButton: 'Compléter le budget de fonctionnement',
    picto: (props) => <FonctionnementPicto {...props} />,
  },
  financeurs: {
    className: 'h-72 min-h-0',
    title: 'Financeurs',
    actionButton: 'Ajouter un financeur',
    picto: (props) => <FinanceursPicto {...props} />,
  },
};
