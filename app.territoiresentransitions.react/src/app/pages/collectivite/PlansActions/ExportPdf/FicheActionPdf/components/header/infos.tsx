import {
  Calendar2Icon,
  CalendarScheduleIcon,
  DownloadIcon,
  EditIcon,
  FileAddIcon,
  LoopLeftIcon,
  TimeIcon,
} from '@/app/ui/export-pdf/assets/icons';
import { Box, Paragraph, Stack } from '@/app/ui/export-pdf/components';
import { preset } from '@/ui';
import classNames from 'classnames';
import { format, isBefore, startOfToday } from 'date-fns';
import { FicheActionPdfProps } from '../../FicheActionPdf';

const { colors } = preset.theme.extend;

export const Infos = ({ fiche }: FicheActionPdfProps) => {
  const {
    modifiedAt,
    modifiedBy,
    createdAt,
    createdBy,
    dateDebut,
    dateFin: dateFinPrevisionnelle,
    ameliorationContinue,
    tempsDeMiseEnOeuvre,
  } = fiche;

  const isLate =
    dateFinPrevisionnelle &&
    isBefore(new Date(dateFinPrevisionnelle), startOfToday());

  return (
    <Stack
      direction="row"
      gap={1}
      className="flex-wrap items-center py-0.5 border-y-[0.5pt] border-primary-3"
    >
      {/* Date de téléchargement */}
      <Stack gap={0.5} direction="row" className="items-center">
        <DownloadIcon fill={colors.grey[8]} />
        <Paragraph className="text-[0.45rem] text-grey-8">
          Téléchargée le {format(new Date(), 'dd/MM/yyyy')}
        </Paragraph>
      </Stack>

      {/* Modifications */}
      {!!modifiedAt && modifiedAt !== createdAt && (
        <>
          <Box className="w-[0.5px] h-4 bg-primary-3" />
          <Stack gap={0.5} direction="row" className="items-center">
            <EditIcon fill={colors.grey[8]} />
            <Paragraph className="text-[0.45rem] text-grey-8">
              Modifiée le {format(new Date(modifiedAt), 'dd/MM/yyyy')}
              {modifiedBy ? ` par ${modifiedBy.prenom} ${modifiedBy.nom}` : ''}
            </Paragraph>
          </Stack>
        </>
      )}

      {/* Création */}
      {!!createdAt && (
        <>
          <Box className="w-[0.5px] h-4 bg-primary-3" />
          <Stack gap={0.5} direction="row" className="items-center">
            <FileAddIcon fill={colors.grey[8]} />
            <Paragraph className="text-[0.45rem] text-grey-8">
              Créée le {format(new Date(createdAt), 'dd/MM/yyyy')}
              {createdBy ? ` par ${createdBy.prenom} ${createdBy.nom}` : ''}
            </Paragraph>
          </Stack>
        </>
      )}

      {/* Date de début */}
      {!!dateDebut && (
        <>
          <Box className="w-[0.5px] h-4 bg-primary-3" />
          <Stack gap={0.5} direction="row" className="items-center">
            <Calendar2Icon fill={colors.grey[8]} />
            <Paragraph className="text-[0.45rem] text-grey-8">
              Début : {format(new Date(dateDebut), 'dd/MM/yyyy')}
            </Paragraph>
          </Stack>
        </>
      )}

      {/* Date de début */}
      {!ameliorationContinue && !!dateFinPrevisionnelle && (
        <>
          <Box className="w-[0.5px] h-4 bg-primary-3" />
          <Stack gap={0.5} direction="row" className="items-center">
            <CalendarScheduleIcon
              fill={isLate ? colors.error[1] : colors.grey[8]}
            />
            <Paragraph
              className={classNames('text-[0.45rem]', {
                'text-grey-8': !isLate,
                'text-error-1': isLate,
              })}
            >
              Fin prévisionnelle :{' '}
              {format(new Date(dateFinPrevisionnelle), 'dd/MM/yyyy')}
            </Paragraph>
          </Stack>
        </>
      )}

      {/* Amélioration continue */}
      {!!ameliorationContinue && (
        <>
          <Box className="w-[0.5px] h-4 bg-primary-3" />
          <Stack gap={0.5} direction="row" className="items-center">
            <LoopLeftIcon fill={colors.grey[8]} />
            <Paragraph className="text-[0.45rem] text-grey-8">
              Tous les ans
            </Paragraph>
          </Stack>
        </>
      )}

      {/* Temps de mise en oeuvre */}
      {!!tempsDeMiseEnOeuvre && tempsDeMiseEnOeuvre.nom !== null && (
        <>
          <Box className="w-[0.5px] h-4 bg-primary-3" />
          <Stack gap={0.5} direction="row" className="items-center">
            <TimeIcon fill={colors.grey[8]} />
            <Paragraph className="text-[0.45rem] text-grey-8">
              Mise en œuvre : {tempsDeMiseEnOeuvre.nom}
            </Paragraph>
          </Stack>
        </>
      )}
    </Stack>
  );
};
