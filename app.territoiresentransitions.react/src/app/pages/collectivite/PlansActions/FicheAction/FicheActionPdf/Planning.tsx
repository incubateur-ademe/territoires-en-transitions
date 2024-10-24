import { isBefore, startOfToday } from 'date-fns';

import Card from 'ui/exportPdf/components/Card';
import Divider from 'ui/exportPdf/components/Divider';
import Stack from 'ui/exportPdf/components/Stack';
import { twToCss } from 'ui/exportPdf/utils';

import { getTextFormattedDate } from '../utils';
import { FicheActionPdfProps } from './FicheActionPdf';

const Planning = ({ fiche }: FicheActionPdfProps) => {
  const {
    ameliorationContinue,
    calendrier: justificationCalendrier,
    dateDebut,
    dateFinProvisoire: dateFinPrevisionnelle,
    niveauPriorite,
    statut,
  } = fiche;

  const isLate =
    dateFinPrevisionnelle &&
    isBefore(new Date(dateFinPrevisionnelle), startOfToday());

  return (
    <Card className="text-center">
      <Stack>
        {/* Date de début */}
        <div>
          <h6 style={twToCss('text-xs text-primary-9 uppercase mt-0 mb-2')}>
            Date de début
          </h6>
          <p
            style={twToCss(
              `text-xs my-0 ${dateDebut ? 'text-primary-10' : 'text-grey-7'}`
            )}
          >
            {!!dateDebut
              ? getTextFormattedDate({ date: dateDebut })
              : 'Non renseignée'}
          </p>
        </div>

        {/* Date de fin prévisionnelle */}
        {!ameliorationContinue && (
          <div>
            <h6 style={twToCss('text-xs text-primary-9 uppercase mt-0 mb-2')}>
              Date de fin prévisionnelle
            </h6>
            <p
              style={twToCss(
                `text-xs my-0 ${
                  dateFinPrevisionnelle
                    ? isLate
                      ? 'text-error-1'
                      : 'text-primary-10'
                    : 'text-grey-7'
                }`
              )}
            >
              {!!dateFinPrevisionnelle
                ? getTextFormattedDate({ date: dateFinPrevisionnelle })
                : 'Non renseignée'}
            </p>
          </div>
        )}

        {(!!statut || !!niveauPriorite || !!ameliorationContinue) && (
          <Divider />
        )}

        <Stack>
          {/* Statut et niveau de priorité */}
          {(!!statut || !!niveauPriorite) && (
            <div style={twToCss('uppercase font-medium')}>
              {niveauPriorite ?? ''}
              {niveauPriorite && statut ? ' - ' : ''}
              {statut ?? ''}
            </div>
          )}

          {/* Action récurrente */}
          {!!ameliorationContinue && (
            <div style={twToCss('text-primary-10 font-medium')}>
              l'action se répète tous les ans
            </div>
          )}
        </Stack>

        {!!justificationCalendrier && <Divider />}

        {/* Justification si l'action est en pause ou abandonnée  */}
        {!!justificationCalendrier && (
          <Stack gap={2}>
            <h6
              style={twToCss('text-xs text-left text-primary-9 uppercase my-0')}
            >
              Précisions statut :
            </h6>
            <p
              style={twToCss(
                'text-xs leading-6 text-left my-0 text-primary-10'
              )}
            >
              {justificationCalendrier}
            </p>
          </Stack>
        )}
      </Stack>
    </Card>
  );
};

export default Planning;
