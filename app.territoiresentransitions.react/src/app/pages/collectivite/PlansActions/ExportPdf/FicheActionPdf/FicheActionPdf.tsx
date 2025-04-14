import { FicheAction, FicheActionNote, FicheResume } from '@/api/plan-actions';
import { TAxeRow } from '@/app/types/alias';
import { Stack, Title } from '@/app/ui/export-pdf/components';
import { AnnexeInfo } from '../../FicheAction/data/useAnnexesFicheActionInfos';

import { RouterOutput } from '@/api/utils/trpc/client';
import Etapes from '@/app/app/pages/collectivite/PlansActions/ExportPdf/FicheActionPdf/Etapes';
import { ActionWithScore } from '@/domain/referentiels';
import { TIndicateurDefinition } from '../../../Indicateurs/types';
import { TSectionsValues, sectionsInitValue } from '../utils';
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
  sections?: TSectionsValues;
  indicateursListe: TIndicateurDefinition[] | undefined | null;
  etapes?: RouterOutput['plans']['fiches']['etapes']['list'];
  fichesLiees: FicheResume[];
  actionsLiees: ActionWithScore[];
  annexes: AnnexeInfo[] | undefined;
  notesSuivi: FicheActionNote[] | undefined;
};

const FicheActionPdf = ({
  fiche,
  sections = sectionsInitValue,
  chemins,
  indicateursListe,
  etapes,
  fichesLiees,
  actionsLiees,
  annexes,
  notesSuivi,
}: FicheActionPdfExtendedProps) => {
  const { titre } = fiche;

  return (
    <Stack>
      <Stack fixed gap={3} className="mb-3">
        {/* Titre */}
        <Title variant="h1" className="leading-5">
          {titre || 'Sans titre'}
        </Title>

        {/* Emplacements de la fiche */}
        <Chemins chemins={chemins} />

        {/* Dates et auteurs */}
        <CreationFiche fiche={fiche} />
      </Stack>

      {/* Description de la fiche */}
      {sections.intro.isChecked && <Description fiche={fiche} />}

      {sections.acteurs.isChecked && (
        <>
          {/* Pilotes */}
          <Pilotes fiche={fiche} />

          {/* Acteurs */}
          <Acteurs fiche={fiche} />
        </>
      )}

      {/* Planning */}
      {sections.planning.isChecked && <Planning fiche={fiche} />}

      {/* Indicateurs */}
      {sections.indicateurs.isChecked && (
        <Indicateurs fiche={fiche} indicateursListe={indicateursListe} />
      )}

      {/* Étapes */}
      {sections.etapes.isChecked && <Etapes etapes={etapes} />}

      {/* Notes de suivi */}
      {sections.notes_suivi.isChecked && (
        <NotesDeSuivi
          notesSuivi={notesSuivi}
          years={sections.notes_suivi.values}
        />
      )}

      {/* Budget */}
      {sections.budget.isChecked && <Budget fiche={fiche} />}

      {/* Fiches des plans liées */}
      {sections.fiches.isChecked && <FichesLiees fichesLiees={fichesLiees} />}

      {/* Mesures des référentiels liées */}
      {sections.actions.isChecked && (
        <ActionsLiees actionsLiees={actionsLiees} />
      )}

      {sections.notes_docs.isChecked && (
        <>
          {/* Notes */}
          <Notes fiche={fiche} />

          {/* Documents */}
          <Documents annexes={annexes} />
        </>
      )}
    </Stack>
  );
};

export default FicheActionPdf;
