import { FicheAction, FicheResume } from '@tet/api/plan-actions';
import { TActionStatutsRow } from 'types/alias';
import { IndicateurDefinition } from '@tet/api/indicateurs/domain';
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

export type FicheActionPdfExtendedProps = FicheActionPdfProps & {
  indicateursListe: IndicateurDefinition[] | undefined | null;
  fichesLiees: FicheResume[];
  actionsLiees: TActionStatutsRow[];
};

const FicheActionPdf = ({
  fiche,
  indicateursListe,
  fichesLiees,
  actionsLiees,
}: FicheActionPdfExtendedProps) => {
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
      <Indicateurs fiche={fiche} indicateursListe={indicateursListe} />

      {/* Budget */}
      <Budget fiche={fiche} />

      {/* Fiches des plans liées */}
      <FichesLiees fichesLiees={fichesLiees} />

      {/* Actions des référentiels liées */}
      <ActionsLiees actionsLiees={actionsLiees} />

      {/* Notes */}
      <Notes fiche={fiche} />
    </Stack>
  );
};

export default FicheActionPdf;
