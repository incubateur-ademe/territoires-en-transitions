import {
  BadgeFinanceur,
  Paragraph,
  Stack,
} from '@/app/ui/export-pdf/components';
import { FicheBudget } from '@tet/domain/plans';
import classNames from 'classnames';
import { Fragment } from 'react';
import BudgetTable from './BudgetTable';

type BudgetContentProps = {
  type: 'investissement' | 'fonctionnement';
  budgets: FicheBudget[];
};

const BudgetContent = ({ type, budgets }: BudgetContentProps) => {
  const extendedBudget = budgets?.filter((elt) => !elt.annee);

  if (!budgets || budgets.length === 0) {
    return (
      <Paragraph className="text-grey-7">
        <Paragraph className="text-primary-9 font-bold uppercase">
          {type === 'investissement'
            ? 'Budget d’investissement : '
            : 'Budget de fonctionnement : '}
        </Paragraph>
        Non renseigné
      </Paragraph>
    );
  }

  return (
    <Stack
      wrap={false}
      gap={1.5}
      direction={extendedBudget.length > 0 ? 'row' : 'col'}
      className={classNames({
        'items-center flex-wrap': extendedBudget.length > 0,
      })}
    >
      <Paragraph>
        <Paragraph className="text-primary-9 font-bold uppercase">
          {type === 'investissement'
            ? 'Budget d’investissement : '
            : 'Budget de fonctionnement : '}
        </Paragraph>
        {extendedBudget.length > 0 && (
          <Paragraph className="text-grey-7">
            Le budget prévisionnel total renseigné{' '}
            {extendedBudget[0].estEtale ? 's’étale' : 'ne s’étale pas'} sur
            toute la durée du plan.
          </Paragraph>
        )}
      </Paragraph>

      {extendedBudget.length > 0 ? (
        extendedBudget.map((b) => (
          <Fragment key={b.id}>
            <BadgeFinanceur
              key={`${b.annee}-previsionnel`}
              nom={
                b.unite === 'HT' ? 'Montant prévisionnel' : 'ETP prévisionnel'
              }
              montant={b.budgetPrevisionnel}
              unite={b.unite}
            />
            <BadgeFinanceur
              key={`${b.annee}-reel`}
              nom={b.unite === 'HT' ? 'Montant dépensé' : 'ETP réel'}
              montant={b.budgetReel}
              unite={b.unite}
            />
          </Fragment>
        ))
      ) : (
        <BudgetTable budgets={budgets} />
      )}
    </Stack>
  );
};

export default BudgetContent;
