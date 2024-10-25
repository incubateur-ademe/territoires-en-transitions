import { Card, Title } from 'ui/exportPdf/components';
import { FicheActionPdfProps } from './FicheActionPdf';
import { useFichesActionLiees } from '../data/useFichesActionLiees';

const FichesLiees = ({ fiche }: FicheActionPdfProps) => {
  // const { data: fichesLiees } = useFichesActionLiees(fiche.id);

  // if (!fichesLiees || fichesLiees.length === 0) return null;

  return (
    <Card wrap={false}>
      <Title variant="h4" className="text-primary-8">
        Fiches des plans liées
      </Title>
    </Card>
  );
};

export default FichesLiees;
