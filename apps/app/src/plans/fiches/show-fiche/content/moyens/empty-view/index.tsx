import { appLabels } from '@/app/labels/catalog';
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
    title: appLabels.budgetInvestissement.replace(' : ', ''),
    actionButton: appLabels.budgetCompleterInvestissement,
    picto: (props) => <InvestmentPicto {...props} />,
  },
  fonctionnement: {
    className: 'h-72 min-h-0',
    title: appLabels.budgetFonctionnement.replace(': ', ''),
    actionButton: appLabels.budgetCompleterFonctionnement,
    picto: (props) => <FonctionnementPicto {...props} />,
  },
  financeurs: {
    className: 'h-72 min-h-0',
    title: 'Financeurs',
    actionButton: appLabels.ajouterFinanceur,
    picto: (props) => <FinanceursPicto {...props} />,
  },
};
