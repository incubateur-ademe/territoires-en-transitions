import classNames from 'classnames';
import {
  BadgeBudget,
  BadgeFinanceur,
  Card,
  Paragraph,
  Stack,
  Title,
} from 'ui/export-pdf/components';
import { getFormattedNumber } from '../utils';
import { FicheActionPdfProps } from './FicheActionPdf';

const Budget = ({ fiche }: FicheActionPdfProps) => {
  const { budgetPrevisionnel, financeurs, financements } = fiche;

  const emptyBudgetPrevisionnel = !budgetPrevisionnel;
  const emptyFinancements = !financements;
  const emptyFinanceurs = !financeurs || financeurs.length === 0;

  if (emptyBudgetPrevisionnel && emptyFinancements && emptyFinanceurs) {
    return null;
  }

  return (
    <Card wrap={false}>
      <Title variant="h4" className="text-primary-8">
        Budget
      </Title>

      {/* Budget prévisionnel total */}
      <Stack
        gap={emptyBudgetPrevisionnel ? 'px' : 2}
        direction="row"
        className="flex-wrap items-center"
      >
        <Paragraph className="text-primary-9 font-bold uppercase">
          Budget prévisionnel total :{' '}
        </Paragraph>
        {emptyBudgetPrevisionnel ? (
          <Paragraph className="text-grey-7">Non renseigné</Paragraph>
        ) : (
          <BadgeBudget montantTtc={budgetPrevisionnel} />
        )}
      </Stack>

      {/* Financeurs */}
      <Stack
        gap={emptyFinanceurs ? 'px' : 2}
        direction="row"
        className="flex-wrap items-center"
      >
        <Paragraph className="text-primary-9 font-bold uppercase">
          Financeurs :{' '}
        </Paragraph>
        {emptyFinanceurs ? (
          <Paragraph className="text-grey-7">Non renseignés</Paragraph>
        ) : (
          financeurs.map((f) => (
            <BadgeFinanceur
              key={f.financeurTag.id}
              nom={f.financeurTag.nom}
              montantTtc={f.montantTtc}
            />
          ))
        )}
      </Stack>

      {/* Financements */}
      <Paragraph className={classNames({ 'text-grey-7': emptyFinancements })}>
        <Paragraph className="text-primary-9 font-bold uppercase">
          Financements :{' '}
        </Paragraph>
        {!emptyFinancements ? financements : 'Non renseignés '}
      </Paragraph>
    </Card>
  );
};

export default Budget;
