import { AnnexeInfo } from '@tet/domain/collectivites';
import {
  AxeLight,
  FicheBudget,
  FicheNote,
  FicheWithRelations,
} from '@tet/domain/plans';
import { Paragraph, Stack, Title } from '../primitives';
import ActionsLiees from './ActionsLiees';
import Description from './Description';
import Documents from './Documents';
import FichesLiees from './FichesLiees';
import Indicateurs from './Indicateurs';
import { Moyens } from './Moyens';
import { Notes } from './Notes';
import Acteurs from './components/acteurs';
import { Chemins, Infos, Statuts } from './components/header';
import { PdfIndicateurDefinition, PdfLinkedAction } from './external-types';
import { PdfSectionKey, allSectionKeys } from './utils';

export type FicheActionPdfExtendedProps = {
  fiche: FicheWithRelations;
  chemins: AxeLight[][];
  sections?: PdfSectionKey[];
  indicateursListe: PdfIndicateurDefinition[] | undefined | null;
  fichesLiees: FicheWithRelations[];
  actionsLiees: PdfLinkedAction[];
  annexes: AnnexeInfo[] | undefined;
  notes: FicheNote[] | undefined;
  notesYears?: number[] | 'all';
  budgets: FicheBudget[] | undefined;
};

const FicheActionPdf = ({
  fiche,
  sections = [...allSectionKeys],
  chemins,
  indicateursListe,
  fichesLiees,
  actionsLiees,
  annexes,
  notes,
  notesYears = 'all',
  budgets,
}: FicheActionPdfExtendedProps) => {
  const { titre } = fiche;
  const enabled = new Set<string>(sections);

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

      {enabled.has('intro') && <Description fiche={fiche} />}

      {enabled.has('acteurs') && <Acteurs fiche={fiche} />}

      {enabled.has('indicateurs') && (
        <Indicateurs fiche={fiche} indicateursListe={indicateursListe} />
      )}

      {enabled.has('notes') && <Notes notes={notes} years={notesYears} />}

      {enabled.has('moyens') && <Moyens fiche={fiche} budgets={budgets} />}
      {enabled.has('fiches') && <FichesLiees fichesLiees={fichesLiees} />}

      {enabled.has('actionsLiees') && (
        <ActionsLiees actionsLiees={actionsLiees} />
      )}

      {enabled.has('documents') && <Documents annexes={annexes} />}
    </Stack>
  );
};

export default FicheActionPdf;
