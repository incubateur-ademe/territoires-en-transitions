import BudgetTable from '@/app/app/pages/collectivite/PlansActions/ExportPdf/FicheActionPdf/BudgetTable';
import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-get-budget';
import {
  BadgeFinanceur,
  Paragraph,
  Stack,
} from '@/app/ui/export-pdf/components';
import classNames from 'classnames';
import { Fragment } from 'react';

type BudgetContentProps = {
  type: 'investissement' | 'fonctionnement';
  budgets: BudgetType[];
};

const BudgetContent = ({ type, budgets }: BudgetContentProps) => {
  const extendedBudget = budgets?.filter((elt) => !elt.annee);

  return budgets && budgets.length > 0 ? (
    // Vue remplie
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
            toute la durée du plan d’action.
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
              montant={
                b.budgetPrevisionnel ? parseFloat(b.budgetPrevisionnel) : null
              }
              unite={b.unite}
            />
            <BadgeFinanceur
              key={`${b.annee}-reel`}
              nom={b.unite === 'HT' ? 'Montant dépensé' : 'ETP réel'}
              montant={b.budgetReel ? parseFloat(b.budgetReel) : null}
              unite={b.unite}
            />
          </Fragment>
        ))
      ) : (
        <BudgetTable budgets={budgets} />
      )}
    </Stack>
  ) : (
    // Vue vide
    <Paragraph className="text-grey-7">
      <Paragraph className="text-primary-9 font-bold uppercase">
        {type === 'investissement'
          ? 'Budget d’investissement : '
          : 'Budget de fonctionnement : '}
      </Paragraph>
      Non renseigné
    </Paragraph>
  );
};

export default BudgetContent;
