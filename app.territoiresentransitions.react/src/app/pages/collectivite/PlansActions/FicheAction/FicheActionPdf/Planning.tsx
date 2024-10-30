import { isBefore, startOfToday } from 'date-fns';
import classNames from 'classnames';
import {
  BadgePriorite,
  BadgeStatut,
  Card,
  Divider,
  Paragraph,
  Stack,
  Title,
} from 'ui/exportPdf/components';
import { LoopLeftIcon } from 'ui/exportPdf/assets/icons';
import { CalendarPicto } from 'ui/exportPdf/assets/picto';
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
    <Card>
      <CalendarPicto className="h-14 w-14 mx-auto" />

      {/* Date de début */}
      <Stack gap={2} className="text-center">
        <Title variant="h6" className="uppercase">
          Date de début
        </Title>
        <Paragraph className={classNames({ 'text-grey-7': !dateDebut })}>
          {!!dateDebut
            ? getTextFormattedDate({ date: dateDebut })
            : 'Non renseignée'}
        </Paragraph>
      </Stack>

      {/* Date de fin prévisionnelle */}
      {!ameliorationContinue && (
        <Stack gap={2} className="text-center">
          <Title variant="h6" className="uppercase">
            Date de fin prévisionnelle
          </Title>
          <Paragraph
            className={classNames({
              'text-grey-7': !dateFinPrevisionnelle,
              'text-error-1': dateFinPrevisionnelle && isLate,
            })}
          >
            {!!dateFinPrevisionnelle
              ? getTextFormattedDate({ date: dateFinPrevisionnelle })
              : 'Non renseignée'}
          </Paragraph>
        </Stack>
      )}

      {(!!statut || !!niveauPriorite || !!ameliorationContinue) && <Divider />}

      <Stack gap={2} className="text-center">
        {/* Statut et niveau de priorité */}
        {
          <Stack direction="row" className="mx-auto">
            {!!niveauPriorite && <BadgePriorite priorite={niveauPriorite} />}
            {<BadgeStatut statut={statut ?? 'Sans statut'} />}
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

      {!!justificationCalendrier && <Divider />}

      {/* Justification si l'action est en pause ou abandonnée  */}
      {!!justificationCalendrier && (
        <Stack gap={2}>
          <Title variant="h6" className="uppercase">
            Précisions statut :
          </Title>
          <Paragraph>{justificationCalendrier}</Paragraph>
        </Stack>
      )}
    </Card>
  );
};

export default Planning;
