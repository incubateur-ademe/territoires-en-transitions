import Card from 'ui/exportPdf/components/Card';
import { twToCss } from 'ui/exportPdf/utils';
import { FicheActionPdfProps } from './FicheActionPdf';
import { useFichesActionLiees } from '../data/useFichesActionLiees';

const FichesLiees = ({ fiche }: FicheActionPdfProps) => {
  // const { data: fichesLiees } = useFichesActionLiees(fiche.id);

  // if (!fichesLiees || fichesLiees.length === 0) return null;

  return (
    <Card>
      <h5 style={twToCss('my-0 text-primary-8 text-base')}>
        Fiches des plans liées
      </h5>
    </Card>
  );
};

export default FichesLiees;
