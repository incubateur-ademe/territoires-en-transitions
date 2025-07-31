import {
  Divider,
  Paragraph,
  Stack,
  Title,
} from '@/app/ui/export-pdf/components';
import { FicheActionPdfProps } from './FicheActionPdf';

const Notes = ({ fiche }: FicheActionPdfProps) => {
  const { notesComplementaires } = fiche;

  if (!notesComplementaires) return null;

  return (
    <>
      <Divider className="mt-2" />
      <Stack>
        <Title variant="h5" className="text-primary-8 uppercase">
          Notes complémentaires
        </Title>
        <Paragraph>{notesComplementaires}</Paragraph>
      </Stack>
    </>
  );
};

export default Notes;
