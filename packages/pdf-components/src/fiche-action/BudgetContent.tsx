import {
  BadgeFinanceur,
  Paragraph,
  Stack,
} from '../primitives';
import { FicheBudget } from '@tet/domain/plans';
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
    <Stack gap={2}>
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
        <Stack direction="row" gap={3} className="flex-wrap items-center">
          {extendedBudget.map((b) => (
            <Stack
              key={b.id}
              direction="row"
              gap={1}
              className="items-center"
            >
              <BadgeFinanceur
                nom={
                  b.unite === 'HT' ? 'Montant prévisionnel' : 'ETP prévisionnel'
                }
                montant={b.budgetPrevisionnel}
                unite={b.unite}
              />
              <BadgeFinanceur
                nom={b.unite === 'HT' ? 'Montant dépensé' : 'ETP réel'}
                montant={b.budgetReel}
                unite={b.unite}
              />
            </Stack>
          ))}
        </Stack>
      ) : (
        <BudgetTable budgets={budgets} />
      )}
    </Stack>
  );
};

export default BudgetContent;
