import BudgetContent from '@/app/app/pages/collectivite/PlansActions/ExportPdf/FicheActionPdf/BudgetContent';
import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-get-budget';
import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import {
  BadgeFinanceur,
  Card,
  Paragraph,
  Stack,
  Title,
} from '@/app/ui/export-pdf/components';
import classNames from 'classnames';

type BudgetProps = {
  fiche: Fiche;
  budgets: BudgetType[] | undefined;
};

const Budget = ({ fiche, budgets = [] }: BudgetProps) => {
  const { financeurs, financements } = fiche;

  const emptyFinancements = !financements;
  const emptyFinanceurs = !financeurs || financeurs.length === 0;

  const budgetInvestissement = budgets.filter(
    (elt) => elt.type === 'investissement'
  );
  const budgetFonctionnement = budgets.filter(
    (elt) => elt.type === 'fonctionnement'
  );

  if (budgets.length === 0 && emptyFinancements && emptyFinanceurs) {
    return null;
  }

  return (
    <Card wrap={false}>
      <Title variant="h4" className="text-primary-8">
        Budget
      </Title>

      {/* Budget*/}
      <BudgetContent type="investissement" budgets={budgetInvestissement} />

      <BudgetContent type="fonctionnement" budgets={budgetFonctionnement} />

      {/* Financeurs */}
      <Stack
        direction={emptyFinanceurs ? 'row' : 'col'}
        gap={emptyFinanceurs ? 'px' : 2}
        className="flex-wrap"
      >
        <Paragraph className="text-primary-9 font-bold uppercase">
          Financeurs :{' '}
        </Paragraph>
        {emptyFinanceurs ? (
          <Paragraph className="text-grey-7">Non renseignés</Paragraph>
        ) : (
          <Stack direction="row" gap={2}>
            {financeurs.map((f) => (
              <BadgeFinanceur
                key={f.financeurTag.id}
                nom={f.financeurTag.nom}
                montant={f.montantTtc}
              />
            ))}
          </Stack>
        )}
      </Stack>

      {/* Financements */}
      <Stack
        direction={emptyFinancements ? 'row' : 'col'}
        gap={emptyFinancements ? 'px' : 1}
        className="flex-wrap"
      >
        <Paragraph className="text-primary-9 font-bold uppercase">
          Financements :{' '}
        </Paragraph>
        <Paragraph className={classNames({ 'text-grey-7': emptyFinancements })}>
          {!emptyFinancements ? financements : 'Non renseignés '}
        </Paragraph>
      </Stack>
    </Card>
  );
};

export default Budget;
