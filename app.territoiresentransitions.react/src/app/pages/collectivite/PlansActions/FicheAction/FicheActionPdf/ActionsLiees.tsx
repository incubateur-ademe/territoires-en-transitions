import Card from 'ui/exportPdf/components/Card';
import { twToCss } from 'ui/exportPdf/utils';
import { FicheActionPdfProps } from './FicheActionPdf';

const ActionsLiees = ({ fiche }: FicheActionPdfProps) => {
  const { actions } = fiche;

  if (!actions || actions.length === 0) return null;

  return (
    <Card>
      <h5 style={twToCss('my-0 text-primary-8 text-base')}>
        Actions des référentiels liées
      </h5>
    </Card>
  );
};

export default ActionsLiees;
