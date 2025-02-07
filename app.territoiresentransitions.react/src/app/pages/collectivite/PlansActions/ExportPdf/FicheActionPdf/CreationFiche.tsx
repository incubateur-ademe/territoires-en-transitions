import {
  Calendar2Icon,
  DownloadIcon,
  FileAddIcon,
} from '@/app/ui/export-pdf/assets/icons';
import { Box, Paragraph, Stack } from '@/app/ui/export-pdf/components';
import { preset } from '@/ui';
import { format } from 'date-fns';
import { FicheActionPdfProps } from './FicheActionPdf';

const { colors } = preset.theme.extend;

const CreationFiche = ({ fiche }: FicheActionPdfProps) => {
  const { modifiedAt, modifiedBy, createdAt, createdBy } = fiche;

  return (
    <Stack
      direction="row"
      gap={2}
      className="flex-wrap items-center py-1 border-y border-primary-3"
    >
      <Stack gap={1} direction="row" className="items-center">
        <DownloadIcon fill={colors.grey[8]} />
        <Paragraph className="text-[0.65rem] text-grey-8">
          Téléchargée le {format(new Date(), 'dd/MM/yyyy')}
        </Paragraph>
      </Stack>

      {!!modifiedAt && modifiedAt !== createdAt && (
        <>
          {<Box className="w-[0.5px] h-4 bg-primary-3" />}
          <Stack gap={1} direction="row" className="items-center">
            <Calendar2Icon fill={colors.grey[8]} />
            <Paragraph className="text-[0.65rem] text-grey-8">
              Modifiée le {format(new Date(modifiedAt), 'dd/MM/yyyy')}
              {modifiedBy !== null
                ? ` par ${modifiedBy.prenom} ${modifiedBy.nom}`
                : ''}
            </Paragraph>
          </Stack>
        </>
      )}

      {!!createdAt && (
        <>
          {!!modifiedAt && <Box className="w-[0.5px] h-4 bg-primary-3" />}
          <Stack gap={1} direction="row" className="items-center">
            <FileAddIcon fill={colors.grey[8]} />
            <Paragraph className="text-[0.65rem] text-grey-8">
              Créée le {format(new Date(createdAt), 'dd/MM/yyyy')}
              {createdBy !== null
                ? ` par ${createdBy.prenom} ${createdBy.nom}`
                : ''}
            </Paragraph>
          </Stack>
        </>
      )}
    </Stack>
  );
};

export default CreationFiche;
