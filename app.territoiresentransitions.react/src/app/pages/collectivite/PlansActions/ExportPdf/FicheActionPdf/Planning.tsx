import { LoopLeftIcon } from '@/app/ui/export-pdf/assets/icons';
import { CalendarPicto } from '@/app/ui/export-pdf/assets/picto';
import {
  BadgePriorite,
  BadgeStatut,
  Card,
  Divider,
  Paragraph,
  Stack,
  Title,
} from '@/app/ui/export-pdf/components';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import classNames from 'classnames';
import { isBefore, startOfToday } from 'date-fns';
import { FicheActionPdfProps } from './FicheActionPdf';

const Planning = ({ fiche }: FicheActionPdfProps) => {
  const {
    ameliorationContinue,
    calendrier: justificationCalendrier,
    dateDebut,
    dateFin: dateFinPrevisionnelle,
    priorite: niveauPriorite,
    statut,
    tempsDeMiseEnOeuvre,
  } = fiche;

  const isLate =
    dateFinPrevisionnelle &&
    isBefore(new Date(dateFinPrevisionnelle), startOfToday());

  return (
    <Card className="justify-center" wrap={false}>
      <CalendarPicto className="h-14 w-14 mx-auto" />

      {/* Date de début */}
      <Stack gap={1} className="text-center">
        <Title variant="h6" className="uppercase">
          Date de début
        </Title>
        <Paragraph className={classNames({ 'text-grey-7': !dateDebut })}>
          {dateDebut
            ? getTextFormattedDate({ date: dateDebut })
            : 'Non renseignée'}
        </Paragraph>
      </Stack>

      {/* Date de fin prévisionnelle */}
      {!ameliorationContinue && (
        <Stack gap={1} className="text-center">
          <Title variant="h6" className="uppercase">
            Date de fin prévisionnelle
          </Title>
          <Paragraph
            className={classNames({
              'text-grey-7': !dateFinPrevisionnelle,
              'text-error-1': dateFinPrevisionnelle && isLate,
            })}
          >
            {dateFinPrevisionnelle
              ? getTextFormattedDate({ date: dateFinPrevisionnelle })
              : 'Non renseignée'}
          </Paragraph>
        </Stack>
      )}

      {/* Temps de mise en oeuvre */}
      <Stack gap={1} className="text-center">
        <Title variant="h6" className="uppercase">
          Temps de mise en œuvre
        </Title>
        <Paragraph
          className={classNames({
            'text-grey-7':
              !tempsDeMiseEnOeuvre || tempsDeMiseEnOeuvre.nom === null,
          })}
        >
          {!!tempsDeMiseEnOeuvre && tempsDeMiseEnOeuvre.nom !== null
            ? tempsDeMiseEnOeuvre.nom
            : 'Non renseigné'}
        </Paragraph>
      </Stack>

      {(!!statut || !!niveauPriorite || !!ameliorationContinue) && (
        <>
          <Divider />
          <Stack gap={2} className="text-center">
            {/* Statut et niveau de priorité */}
            {
              <Stack direction="row" className="mx-auto">
                {!!niveauPriorite && (
                  <BadgePriorite priorite={niveauPriorite} />
                )}
                {!!statut && <BadgeStatut statut={statut} />}
              </Stack>
            }

            {/* Action récurrente */}
            {!!ameliorationContinue && (
              <Stack
                direction="row"
                gap={1}
                className="items-center justify-center"
              >
                <LoopLeftIcon />
                <Paragraph className="font-medium">
                  l'action se répète tous les ans
                </Paragraph>
              </Stack>
            )}
          </Stack>
        </>
      )}

      {!!justificationCalendrier && <Divider />}

      {/* Justification si l'action est en pause ou abandonnée  */}
      {!!justificationCalendrier && (
        <Stack gap={2}>
          <Title variant="h6" className="uppercase">
            Calendrier :
          </Title>
          <Paragraph>{justificationCalendrier}</Paragraph>
        </Stack>
      )}
    </Card>
  );
};

export default Planning;
