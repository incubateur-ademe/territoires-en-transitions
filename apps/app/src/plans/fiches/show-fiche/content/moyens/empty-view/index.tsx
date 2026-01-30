import { BudgetType } from '@tet/domain/plans';

import { EmptyCard } from '@tet/ui';
import { JSX, SVGProps } from 'react';
import { FinanceursPicto } from './financeurs.picto';
import { FonctionnementPicto } from './fonctionnement.picto';
import { InvestmentPicto } from './investissement.picto';

const labels: Record<
  BudgetType | 'financeurs',
  {
    title: string;
    actionButton: string;
    picto: (props: SVGProps<SVGSVGElement>) => JSX.Element;
  }
> = {
  investissement: {
    title: "Budget d'investissement",
    actionButton: "Compléter le budget d'investissement",
    picto: InvestmentPicto,
  },
  fonctionnement: {
    title: 'Budget de fonctionnement',
    actionButton: 'Compléter le budget de fonctionnement',
    picto: FonctionnementPicto,
  },
  financeurs: {
    title: 'Financeurs',
    actionButton: 'Ajouter un financeur',
    picto: FinanceursPicto,
  },
};

export const EmptyTableView = ({
  type,
  onClick,
}: {
  type: BudgetType | 'financeurs';
  onClick: () => void;
}) => {
  const { title, actionButton, picto: PictoComponent } = labels[type];
  return (
    <EmptyCard
      picto={(props) => <PictoComponent {...props} />}
      title={title}
      size="xs"
      variant="grey"
      actions={[
        {
          children: actionButton,
          variant: 'outlined',
          onClick,
        },
      ]}
    />
  );
};
