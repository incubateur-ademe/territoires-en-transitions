import { Card, Paragraph, Title } from '@/app/ui/export-pdf/components';
import { FicheActionPdfProps } from './FicheActionPdf';

const Notes = ({ fiche }: FicheActionPdfProps) => {
  const { notesComplementaires } = fiche;

  if (!notesComplementaires) return null;

  return (
    <Card>
      <Title variant="h4" className="text-primary-8">
        Notes complémentaires
      </Title>
      <Paragraph>{notesComplementaires}</Paragraph>
    </Card>
  );
};

export default Notes;
