import { FicheActionNote } from '@/api/plan-actions';
import { RouterOutput } from '@/api/utils/trpc/client';
import Etapes from '@/app/app/pages/collectivite/PlansActions/ExportPdf/FicheActionPdf/Etapes';
import Acteurs from '@/app/app/pages/collectivite/PlansActions/ExportPdf/FicheActionPdf/components/acteurs';
import Calendrier from '@/app/app/pages/collectivite/PlansActions/ExportPdf/FicheActionPdf/components/calendrier';
import {
  Chemins,
  Infos,
  Statuts,
} from '@/app/app/pages/collectivite/PlansActions/ExportPdf/FicheActionPdf/components/header';
import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-get-budget';
import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { TAxeRow } from '@/app/types/alias';
import { Paragraph, Stack, Title } from '@/app/ui/export-pdf/components';
import { FicheResume } from '@/domain/plans/fiches';
import { ActionWithScore } from '@/domain/referentiels';
import { TIndicateurDefinition } from '../../../Indicateurs/types';
import { AnnexeInfo } from '../../FicheAction/data/useAnnexesFicheActionInfos';
import { TSectionsValues, sectionsInitValue } from '../utils';
import ActionsLiees from './ActionsLiees';
import Budget from './Budget';
import Description from './Description';
import Documents from './Documents';
import FichesLiees from './FichesLiees';
import Indicateurs from './Indicateurs';
import Notes from './Notes';
import NotesDeSuivi from './NotesDeSuivi';

export type FicheActionPdfProps = {
  fiche: Fiche;
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
  budgets: BudgetType[] | undefined;
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
  budgets,
}: FicheActionPdfExtendedProps) => {
  const { titre } = fiche;

  return (
    <Stack>
      <Paragraph
        fixed
        className="text-right text-[0.5rem] text-primary-8 italic mt-0.5 mb-1"
      >
        {titre}
      </Paragraph>

      <Stack gap={1}>
        {/* Statut et niveau de priorité */}
        <Statuts statut={fiche.statut} niveauPriorite={fiche.priorite} />

        {/* Titre */}
        <Title variant="h3" className="leading-5">
          {titre || 'Sans titre'}
        </Title>

        {/* Emplacements de la fiche */}
        <Chemins chemins={chemins} />

        {/* Informations générales de la fiche */}
        <Infos fiche={fiche} />
      </Stack>

      {/* Description de la fiche */}
      {sections.intro.isChecked && <Description fiche={fiche} />}

      {/* Acteurs */}
      {sections.acteurs.isChecked && <Acteurs fiche={fiche} />}

      {/* Planning */}
      {sections.planning.isChecked && (
        <Calendrier justificationCalendrier={fiche.calendrier} />
      )}

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
      {sections.budget.isChecked && <Budget fiche={fiche} budgets={budgets} />}

      {/* Fiches action liées */}
      {sections.fiches.isChecked && <FichesLiees fichesLiees={fichesLiees} />}

      {/* Mesures des référentiels liées */}
      {sections.actionsLiees.isChecked && (
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
