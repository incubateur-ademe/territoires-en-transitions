import { FicheAction } from '@tet/api/plan-actions';
import { twToCss } from 'ui/exportPdf/utils';
import Stack from 'ui/exportPdf/components/Stack';

import Description from './Description';
import CreationFiche from './CreationFiche';
import Planning from './Planning';
import Acteurs from './Acteurs';
import Indicateurs from './Indicateurs';
import Budget from './Budget';
import FichesLiees from './FichesLiees';
import ActionsLiees from './ActionsLiees';
import Notes from './Notes';

export type FicheActionPdfProps = {
  fiche: FicheAction;
};

const FicheActionPdf = ({ fiche }: FicheActionPdfProps) => {
  const { titre } = fiche;

  return (
    <div>
      {/* Titre */}
      <h1 style={twToCss('mt-0 mb-2 text-2xl text-primary-9 font-bold')}>
        {titre || 'Sans titre'}
      </h1>

      <Stack>
        {/* Description de la fiche */}
        <Description fiche={fiche} />

        {/* Informations principales */}
        <div style={twToCss('flex flex-row')}>
          <Stack className="w-3/5 mr-2">
            {/* Dates et auteurs */}
            <CreationFiche fiche={fiche} />

            {/* Planning */}
            <Planning fiche={fiche} />
          </Stack>

          {/* Acteurs */}
          <Acteurs fiche={fiche} />
        </div>

        {/* Indicateurs */}
        <Indicateurs fiche={fiche} />

        {/* Budget */}
        <Budget fiche={fiche} />

        {/* Fiches des plans liées */}
        <FichesLiees fiche={fiche} />

        {/* Actions des référentiels liées */}
        <ActionsLiees fiche={fiche} />

        {/* Notes */}
        <Notes fiche={fiche} />
      </Stack>
    </div>
  );
};

export default FicheActionPdf;
