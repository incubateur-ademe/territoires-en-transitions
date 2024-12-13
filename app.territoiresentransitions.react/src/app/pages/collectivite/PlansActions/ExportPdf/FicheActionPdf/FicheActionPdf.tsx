import { IndicateurDefinition } from '@/api/indicateurs/domain';
import { FicheAction, FicheActionNote, FicheResume } from '@/api/plan-actions';
import { TActionStatutsRow, TAxeRow } from '@/app/types/alias';
import { Divider, Stack, Title } from '@/app/ui/export-pdf/components';
import { AnnexeInfo } from '../../FicheAction/data/useAnnexesFicheActionInfos';

import Acteurs from './Acteurs';
import ActionsLiees from './ActionsLiees';
import Budget from './Budget';
import Chemins from './Chemins';
import CreationFiche from './CreationFiche';
import Description from './Description';
import Documents from './Documents';
import FichesLiees from './FichesLiees';
import Indicateurs from './Indicateurs';
import Notes from './Notes';
import NotesDeSuivi from './NotesDeSuivi';
import Pilotes from './Pilotes';
import Planning from './Planning';

export type FicheActionPdfProps = {
  fiche: FicheAction;
};

export type FicheActionPdfExtendedProps = FicheActionPdfProps & {
  chemins: TAxeRow[][];
  indicateursListe: IndicateurDefinition[] | undefined | null;
  fichesLiees: FicheResume[];
  actionsLiees: TActionStatutsRow[];
  annexes: AnnexeInfo[] | undefined;
  notesSuivi: FicheActionNote[] | undefined;
};

const FicheActionPdf = ({
  fiche,
  chemins,
  indicateursListe,
  fichesLiees,
  actionsLiees,
  annexes,
  notesSuivi,
}: FicheActionPdfExtendedProps) => {
  const { titre } = fiche;

  return (
    <Stack>
      <Stack fixed>
        {/* Titre */}
        <Title variant="h1" className="leading-5">
          {titre || 'Sans titre'}
        </Title>

        {/* Emplacements de la fiche */}
        <Chemins chemins={chemins} />

        <Divider />
      </Stack>

      {/* Description de la fiche */}
      <Description fiche={fiche} />

      {/* Informations principales */}
      <Stack wrap={false} direction="row">
        <Stack className="w-[49%]">
          {/* Dates et auteurs */}
          <CreationFiche fiche={fiche} />

          {/* Pilotes */}
          <Pilotes fiche={fiche} />
        </Stack>

        {/* Planning */}
        <Planning fiche={fiche} />
      </Stack>

      {/* Acteurs */}
      <Acteurs fiche={fiche} />

      {/* Indicateurs */}
      <Indicateurs fiche={fiche} indicateursListe={indicateursListe} />

      {/* Notes de suivi */}
      <NotesDeSuivi notesSuivi={notesSuivi} />

      {/* Budget */}
      <Budget fiche={fiche} />

      {/* Fiches des plans liées */}
      <FichesLiees fichesLiees={fichesLiees} />

      {/* Actions des référentiels liées */}
      <ActionsLiees actionsLiees={actionsLiees} />

      {/* Notes */}
      <Notes fiche={fiche} />

      {/* Documents */}
      <Documents annexes={annexes} />
    </Stack>
  );
};

export default FicheActionPdf;
