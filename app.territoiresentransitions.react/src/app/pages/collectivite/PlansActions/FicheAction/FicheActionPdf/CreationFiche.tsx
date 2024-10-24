import { format } from 'date-fns';
import { twToCss } from 'ui/exportPdf/utils';
import Card from 'ui/exportPdf/components/Card';
import { FicheActionPdfProps } from './FicheActionPdf';

const CreationFiche = ({ fiche }: FicheActionPdfProps) => {
  const { modifiedAt, createdAt } = fiche;

  if (!modifiedAt && !createdAt) return null;

  return (
    <Card className="text-primary-10 italic py-3">
      {modifiedAt && (
        <div style={twToCss(createdAt ? 'mb-2' : 'mb-1')}>
          Dernière modification le {format(new Date(modifiedAt), 'dd/MM/yyyy')}
        </div>
      )}
      {createdAt && (
        <div style={twToCss('mb-1')}>
          Fiche action créée le {format(new Date(createdAt), 'dd/MM/yyyy')}
        </div>
      )}
    </Card>
  );
};

export default CreationFiche;
