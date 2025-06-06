import { Paragraph, Stack, Title } from '@/app/ui/export-pdf/components';
import { FicheActionPdfProps } from './FicheActionPdf';

const Notes = ({ fiche }: FicheActionPdfProps) => {
  const { notesComplementaires } = fiche;

  if (!notesComplementaires) return null;

  return (
    <Stack>
      <Title variant="h6" className="text-primary-8">
        Notes complémentaires
      </Title>
      <Paragraph>{notesComplementaires}</Paragraph>
    </Stack>
  );
};

export default Notes;
