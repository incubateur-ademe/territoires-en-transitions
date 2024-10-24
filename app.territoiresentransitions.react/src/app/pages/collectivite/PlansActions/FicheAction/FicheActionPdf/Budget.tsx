import Card from 'ui/exportPdf/components/Card';
import Stack from 'ui/exportPdf/components/Stack';
import { twToCss } from 'ui/exportPdf/utils';
import { FicheActionPdfProps } from './FicheActionPdf';
import { getFormattedNumber } from '../utils';

const Budget = ({ fiche }: FicheActionPdfProps) => {
  const { budgetPrevisionnel, financeurs, financements } = fiche;

  if (
    !budgetPrevisionnel &&
    !financements &&
    (!financeurs || financeurs.length === 0)
  ) {
    return null;
  }

  return (
    <Card>
      <Stack>
        <h5 style={twToCss('my-0 text-primary-8 text-base')}>Budget</h5>

        {/* Budget prévisionnel total */}
        <div>
          <span
            style={twToCss(
              'text-xs text-primary-9 font-bold uppercase my-0 mr-1'
            )}
          >
            Budget prévisionnel total :{' '}
          </span>
          <span
            style={twToCss(
              `text-xs leading-6 my-0 ${
                !!budgetPrevisionnel ? 'text-primary-10' : 'text-grey-7'
              }`
            )}
          >
            {!!budgetPrevisionnel
              ? `${getFormattedNumber(budgetPrevisionnel)}€ TTC `
              : 'Non renseigné'}
          </span>
        </div>

        {/* Financeurs */}
        <div>
          <span
            style={twToCss(
              'text-xs text-primary-9 font-bold uppercase my-0 mr-1'
            )}
          >
            Financeurs :{' '}
          </span>
          <span
            style={twToCss(
              `text-xs leading-6 my-0 ${
                financeurs && financeurs.length
                  ? 'text-primary-10'
                  : 'text-grey-7'
              }`
            )}
          >
            {financeurs && financeurs.length
              ? financeurs
                  .map(
                    (f) =>
                      `${f.financeurTag.nom}${
                        f.montantTtc
                          ? ` (${getFormattedNumber(f.montantTtc)} € TTC)`
                          : ''
                      }`
                  )
                  .join(', ')
              : 'Non renseignés'}
          </span>
        </div>

        {/* Financements */}
        <div>
          <span
            style={twToCss(
              'text-xs text-primary-9 font-bold uppercase my-0 mr-1'
            )}
          >
            Financements :{' '}
          </span>
          <span
            style={twToCss(
              `text-xs leading-6 my-0 ${
                !!financements ? 'text-primary-10' : 'text-grey-7'
              }`
            )}
          >
            {!!financements ? financements : 'Non renseignés '}
          </span>
        </div>
      </Stack>
    </Card>
  );
};

export default Budget;
