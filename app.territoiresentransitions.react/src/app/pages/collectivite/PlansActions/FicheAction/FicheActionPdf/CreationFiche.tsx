import { format } from 'date-fns';
import { Card, Paragraph } from 'ui/exportPdf/components';
import { FicheActionPdfProps } from './FicheActionPdf';

const CreationFiche = ({ fiche }: FicheActionPdfProps) => {
  const { modifiedAt, createdAt } = fiche;

  if (!modifiedAt && !createdAt) return null;

  return (
    <Card gap={1} className="py-3 italic">
      {modifiedAt && (
        <Paragraph>
          Dernière modification le {format(new Date(modifiedAt), 'dd/MM/yyyy')}
        </Paragraph>
      )}
      {createdAt && (
        <Paragraph>
          Fiche action créée le {format(new Date(createdAt), 'dd/MM/yyyy')}
        </Paragraph>
      )}
    </Card>
  );
};

export default CreationFiche;
