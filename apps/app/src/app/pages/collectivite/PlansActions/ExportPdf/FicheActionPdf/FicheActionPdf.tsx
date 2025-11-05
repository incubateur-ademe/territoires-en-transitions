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
import { IndicateurDefinition } from '@/app/indicateurs/definitions/use-get-indicateur-definition';
import { TAxeRow } from '@/app/types/alias';
import { Paragraph, Stack, Title } from '@/app/ui/export-pdf/components';
import {
  FicheActionBudget,
  FicheResume,
  FicheWithRelations,
} from '@/domain/plans';
import { ActionWithScore } from '@/domain/referentiels';
import { AnnexeInfo } from '../../FicheAction/data/useAnnexesFicheActionInfos';
import { TSectionsValues, sectionsInitValue } from '../utils';
import ActionsLiees from './ActionsLiees';
import Description from './Description';
import Documents from './Documents';
import FichesLiees from './FichesLiees';
import Indicateurs from './Indicateurs';
import { Moyens } from './Moyens';
import Notes from './Notes';
import NotesDeSuivi from './NotesDeSuivi';

export type FicheActionPdfExtendedProps = {
  fiche: FicheWithRelations;
  chemins: TAxeRow[][];
  sections?: TSectionsValues;
  indicateursListe: IndicateurDefinition[] | undefined | null;
  etapes?: RouterOutput['plans']['fiches']['etapes']['list'];
  fichesLiees: FicheResume[];
  actionsLiees: ActionWithScore[];
  annexes: AnnexeInfo[] | undefined;
  notesSuivi: FicheActionNote[] | undefined;
  budgets: FicheActionBudget[] | undefined;
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
        <Statuts statut={fiche.statut} niveauPriorite={fiche.priorite} />

        <Title variant="h3" className="leading-5">
          {titre || 'Sans titre'}
        </Title>

        <Chemins chemins={chemins} />

        <Infos fiche={fiche} />
      </Stack>

      {sections.intro.isChecked && <Description fiche={fiche} />}

      {sections.acteurs.isChecked && <Acteurs fiche={fiche} />}

      {sections.planning.isChecked && (
        <Calendrier justificationCalendrier={fiche.calendrier} />
      )}

      {sections.indicateurs.isChecked && (
        <Indicateurs fiche={fiche} indicateursListe={indicateursListe} />
      )}

      {sections.etapes.isChecked && <Etapes etapes={etapes} />}

      {sections.notes_suivi.isChecked && (
        <NotesDeSuivi
          notesSuivi={notesSuivi}
          years={sections.notes_suivi.values}
        />
      )}

      {sections.moyens.isChecked && <Moyens fiche={fiche} budgets={budgets} />}
      {sections.fiches.isChecked && <FichesLiees fichesLiees={fichesLiees} />}

      {sections.actionsLiees.isChecked && (
        <ActionsLiees actionsLiees={actionsLiees} />
      )}

      {sections.notes_docs.isChecked && (
        <>
          <Notes fiche={fiche} />

          <Documents annexes={annexes} />
        </>
      )}
    </Stack>
  );
};

export default FicheActionPdf;
