import { Card, Title } from 'ui/exportPdf/components';
import { FicheActionPdfProps } from './FicheActionPdf';

const ActionsLiees = ({ fiche }: FicheActionPdfProps) => {
  const { actions } = fiche;

  if (!actions || actions.length === 0) return null;

  return (
    <Card wrap={false}>
      <Title variant="h4" className="text-primary-8">
        Actions des référentiels liées
      </Title>
    </Card>
  );
};

export default ActionsLiees;
