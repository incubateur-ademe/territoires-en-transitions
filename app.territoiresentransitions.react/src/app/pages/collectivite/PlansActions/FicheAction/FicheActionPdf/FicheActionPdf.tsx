import { FicheAction } from '@tet/api/plan-actions';
import { twToCss } from 'ui/exportPdf/utils';

import Description from './Description';
import CreationFiche from './CreationFiche';
import Planning from './Planning';
import Acteurs from './Acteurs';

export type FicheActionPdfProps = {
  fiche: FicheAction;
};

const FicheActionPdf = ({ fiche }: FicheActionPdfProps) => {
  const { titre, modifiedAt, createdAt } = fiche;

  return (
    <div>
      {/* Titre */}
      <h1 style={twToCss('mt-0 mb-2 text-2xl text-primary-9 font-bold')}>
        {titre || 'Sans titre'}
      </h1>

      <div style={twToCss('flex flex-col')}>
        {/* Description de la fiche */}
        <Description fiche={fiche} />

        {/* Informations principales */}
        <div style={twToCss('flex flex-row')}>
          <div style={twToCss('w-3/5 mr-2')}>
            {/* Dates et auteurs */}
            <CreationFiche fiche={fiche} />

            {/* Planning */}
            <Planning fiche={fiche} />
          </div>

          {/* Acteurs */}
          <Acteurs fiche={fiche} />
        </div>
      </div>
    </div>
  );
};

export default FicheActionPdf;
