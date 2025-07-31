import BudgetContent from '@/app/app/pages/collectivite/PlansActions/ExportPdf/FicheActionPdf/BudgetContent';
import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-get-budget';
import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import {
  BadgeFinanceur,
  Divider,
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
    <>
      <Divider className="mt-2" />
      <Stack>
        <Title variant="h5" className="text-primary-8 uppercase">
          Budget
        </Title>

        {/* Budget*/}
        <BudgetContent type="investissement" budgets={budgetInvestissement} />

        <BudgetContent type="fonctionnement" budgets={budgetFonctionnement} />

        {/* Financeurs */}
        {emptyFinanceurs ? (
          <Paragraph className="text-grey-7">
            <Paragraph className="text-primary-9 font-bold uppercase">
              Financeurs :{' '}
            </Paragraph>
            Non renseignés
          </Paragraph>
        ) : (
          <Stack direction="row" gap={1.5} className="flex-wrap items-center">
            <Paragraph className="text-primary-9 font-bold uppercase">
              Financeurs :
            </Paragraph>
            {financeurs.map((f) => (
              <BadgeFinanceur
                key={f.financeurTag.id}
                nom={f.financeurTag.nom}
                montant={f.montantTtc}
              />
            ))}
          </Stack>
        )}

        {/* Financements */}
        <Paragraph
          className={classNames({
            'text-grey-7': emptyFinancements,
          })}
        >
          <Paragraph className="text-primary-9 font-bold uppercase">
            Financements :{' '}
          </Paragraph>
          {!emptyFinancements ? financements : 'Non renseignés '}
        </Paragraph>
      </Stack>
    </>
  );
};

export default Budget;
