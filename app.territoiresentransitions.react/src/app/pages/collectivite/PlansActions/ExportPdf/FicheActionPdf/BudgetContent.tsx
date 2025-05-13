import BudgetTable from '@/app/app/pages/collectivite/PlansActions/ExportPdf/FicheActionPdf/BudgetTable';
import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-get-budget';
import {
  BadgeFinanceur,
  Paragraph,
  Stack,
} from '@/app/ui/export-pdf/components';
import { Fragment } from 'react';

type BudgetContentProps = {
  type: 'investissement' | 'fonctionnement';
  budgets: BudgetType[];
};

const BudgetContent = ({ type, budgets }: BudgetContentProps) => {
  const extendedBudget = budgets?.filter((elt) => !elt.annee);

  return budgets && budgets.length > 0 ? (
    // Vue remplie
    <Stack gap={2}>
      <Paragraph className="text-primary-9 font-bold uppercase">
        {type === 'investissement'
          ? 'Budget d’investissement : '
          : 'Budget de fonctionnement : '}
      </Paragraph>

      {extendedBudget.length > 0 ? (
        <>
          <Paragraph className="text-grey-8 font-medium">
            Le budget prévisionnel total renseigné{' '}
            {extendedBudget[0].estEtale ? 's’étale' : 'ne s’étale pas'} sur
            toute la durée du plan d’action.
          </Paragraph>
          <Stack direction="row" gap={2} className="flex-wrap">
            {extendedBudget.map((b) => (
              <Fragment key={b.id}>
                <BadgeFinanceur
                  key={`${b.annee}-previsionnel`}
                  nom={
                    b.unite === 'HT'
                      ? 'Montant prévisionnel'
                      : 'ETP prévisionnel'
                  }
                  montant={
                    b.budgetPrevisionnel ? parseInt(b.budgetPrevisionnel) : null
                  }
                  unite={b.unite}
                />
                <BadgeFinanceur
                  key={`${b.annee}-reel`}
                  nom={b.unite === 'HT' ? 'Montant dépensé' : 'ETP réel'}
                  montant={b.budgetReel ? parseInt(b.budgetReel) : null}
                  unite={b.unite}
                />
              </Fragment>
            ))}
          </Stack>
        </>
      ) : (
        <BudgetTable budgets={budgets} />
      )}
    </Stack>
  ) : (
    // Vue vide
    <Stack direction="row" gap="px">
      <Paragraph className="text-primary-9 font-bold uppercase">
        {type === 'investissement'
          ? 'Budget d’investissement : '
          : 'Budget de fonctionnement : '}
      </Paragraph>
      <Paragraph className="text-grey-7">Non renseigné</Paragraph>
    </Stack>
  );
};

export default BudgetContent;
