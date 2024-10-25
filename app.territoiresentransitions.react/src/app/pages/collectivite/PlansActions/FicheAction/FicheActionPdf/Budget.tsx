import classNames from 'classnames';
import { Card, Paragraph, Title } from 'ui/exportPdf/components';
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

  const financeursList = !emptyFinanceurs
    ? financeurs
        .map(
          (f) =>
            `${f.financeurTag.nom}${
              f.montantTtc ? ` (${getFormattedNumber(f.montantTtc)} € TTC)` : ''
            }`
        )
        .join(', ')
    : 'Non renseignés';

  return (
    <Card wrap={false}>
      <Title variant="h4" className="text-primary-8">
        Budget
      </Title>

      {/* Budget prévisionnel total */}
      <Paragraph
        className={classNames({ 'text-grey-7': emptyBudgetPrevisionnel })}
      >
        <Paragraph className="text-primary-9 font-bold uppercase">
          Budget prévisionnel total :{' '}
        </Paragraph>
        {!emptyBudgetPrevisionnel
          ? `${getFormattedNumber(budgetPrevisionnel)}€ TTC `
          : 'Non renseigné'}
      </Paragraph>

      {/* Financeurs */}
      <Paragraph className={classNames({ 'text-grey-7': emptyFinanceurs })}>
        <Paragraph className="text-primary-9 font-bold uppercase">
          Financeurs :{' '}
        </Paragraph>
        {financeursList}
      </Paragraph>

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
