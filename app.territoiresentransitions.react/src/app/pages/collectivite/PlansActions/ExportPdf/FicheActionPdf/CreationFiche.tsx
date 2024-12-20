import { Card, Paragraph } from '@/app/ui/export-pdf/components';
import { format } from 'date-fns';
import { FicheActionPdfProps } from './FicheActionPdf';

const CreationFiche = ({ fiche }: FicheActionPdfProps) => {
  const { modifiedAt, modifiedBy, createdAt, createdBy } = fiche;

  if (!modifiedAt && !createdAt) return null;

  return (
    <Card gap={1} className="py-3 italic">
      <Paragraph>
        {modifiedAt && (
          <>
            Dernière modification le{' '}
            {format(new Date(modifiedAt), 'dd/MM/yyyy')}
            {modifiedBy !== null
              ? ` par ${modifiedBy.prenom} ${modifiedBy.nom}`
              : ''}
          </>
        )}
      </Paragraph>

      <Paragraph>Téléchargée le {format(new Date(), 'dd/MM/yyyy')}</Paragraph>

      {createdAt && (
        <Paragraph>
          Fiche action créée le {format(new Date(createdAt), 'dd/MM/yyyy')}
          {createdBy !== null
            ? ` par ${createdBy.prenom} ${createdBy.nom}`
            : ''}
        </Paragraph>
      )}
    </Card>
  );
};

export default CreationFiche;
