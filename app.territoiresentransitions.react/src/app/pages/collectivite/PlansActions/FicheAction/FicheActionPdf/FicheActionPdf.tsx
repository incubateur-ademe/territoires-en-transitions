import { FicheAction } from '@tet/api/plan-actions';
import { Stack, Title } from 'ui/exportPdf/components';

import Acteurs from './Acteurs';
import ActionsLiees from './ActionsLiees';
import Budget from './Budget';
import CreationFiche from './CreationFiche';
import Description from './Description';
import FichesLiees from './FichesLiees';
import Indicateurs from './Indicateurs';
import Notes from './Notes';
import Planning from './Planning';

export type FicheActionPdfProps = {
  fiche: FicheAction;
};

const FicheActionPdf = ({ fiche }: FicheActionPdfProps) => {
  const { titre } = fiche;

  return (
    <Stack>
      {/* Titre */}
      <Title variant="h1" fixed>
        {titre || 'Sans titre'}
      </Title>

      {/* Description de la fiche */}
      <Description fiche={fiche} />

      {/* Informations principales */}
      <Stack direction="row">
        <Stack className="w-3/5">
          {/* Dates et auteurs */}
          <CreationFiche fiche={fiche} />

          {/* Planning */}
          <Planning fiche={fiche} />
        </Stack>

        {/* Acteurs */}
        <Acteurs fiche={fiche} />
      </Stack>

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
  );
};

export default FicheActionPdf;
