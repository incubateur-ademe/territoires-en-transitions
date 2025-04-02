import { format } from 'date-fns';
import { isNotNil } from 'es-toolkit';
import { Cell, Workbook } from 'exceljs';
import {
  formatDate,
  joinNames,
  normalizeWorksheetName,
  NUM_FORMAT_EURO,
} from '../../../utils/excel/excel.utils';
import { Plan, PlanFiche, PlanRow } from '../plan-actions.service';

const depthToLabel: Record<number, string> = {
  1: 'Axe (x)',
  2: 'Sous-axe (x.x)',
  3: 'Sous-sous-axe (x.x.x)',
};

const getDepthLabel = (depth: number) =>
  depthToLabel[depth] || Array(depth).fill('x').join('.');

const HEADER_ROW = 1;
const SUB_HEADER_ROW = HEADER_ROW + 1;

// styles pour les en-têtes
const HEADER_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: '6A6AF4' },
} as const;
const SUB_HEADER_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'CECECE ' },
} as const;
const HEADER_FONT = { color: { argb: 'FFFFFF' } } as const;

const participationCitoyenneTypeToLabel: Record<string, string> = {
  'pas-de-participation': 'Pas de participation citoyenne',
  information: 'Information',
  consultation: 'Consultation',
  concertation: 'Concertation',
  'co-construction': 'Co-construction',
};

type Section = { sectionLabel: string; cols: (plan: Plan) => SectionCol[] };
type SectionCol = {
  colLabel: string;
  cellValue: (row: PlanRow) => string | number | undefined | null;
  cellProps?: Partial<Cell>;
};

const PRESENTATION: Section = {
  sectionLabel: "Présentation de l'action",
  cols: ({ maxDepth }) => [
    ...Array.from({ length: maxDepth }).map((_, i) => ({
      colLabel: getDepthLabel(i + 1),
      cellValue: ({ path, depth, nom }: PlanRow) =>
        depth === 0 ? '(Fiche non classée)' : [...path, nom][i],
    })),
    {
      colLabel: 'Titre de la fiche action',
      cellValue: ({ fiche }: PlanRow) => fiche?.titre,
    },
    {
      colLabel: 'Descriptif',
      cellValue: ({ fiche }: PlanRow) => fiche?.description,
    },
    {
      colLabel: 'Thématique principale',
      cellValue: ({ fiche }: PlanRow) => joinNames(fiche?.thematiques),
    },
    {
      colLabel: 'Sous-thématiques',
      cellValue: ({ fiche }: PlanRow) => joinNames(fiche?.sousThematiques),
    },
    {
      colLabel: 'Tags de suivi',
      cellValue: ({ fiche }: PlanRow) => joinNames(fiche?.tags),
    },
    {
      colLabel: 'Moyens humains et techniques',
      cellValue: ({ fiche }: PlanRow) => fiche?.ressources,
    },
    {
      colLabel: 'Instances de gouvernance',
      cellValue: ({ fiche }: PlanRow) => fiche?.instanceGouvernance,
    },
  ],
};

const ACCES: Section = {
  sectionLabel: 'Gestion des accès',
  cols: () => [
    {
      colLabel: 'Confidentialité de la fiche',
      cellValue: ({ fiche }) => (fiche?.restreint ? 'Oui' : 'Non'),
    },
  ],
};

const MISE_EN_OEUVRE: Section = {
  sectionLabel: 'Modalités de mise en oeuvre',
  cols: () => [
    { colLabel: 'Statut', cellValue: ({ fiche }) => fiche?.statut },
    {
      colLabel: 'Niveau de priorité',
      cellValue: ({ fiche }) => fiche?.priorite,
    },
    {
      colLabel: 'Temps de mise en œuvre',
      cellValue: ({ fiche }) => fiche?.tempsDeMiseEnOeuvreNom,
    },
    {
      colLabel: 'Date de début',
      cellValue: ({ fiche }) => formatDate(fiche?.dateDebut),
    },
    {
      colLabel: 'Date de fin',
      cellValue: ({ fiche }) => formatDate(fiche?.dateFin),
    },
    {
      colLabel: 'Action en amélioration continue',
      cellValue: ({ fiche }) => (fiche?.ameliorationContinue ? 'Oui' : ''),
    },
    { colLabel: 'Calendrier', cellValue: ({ fiche }) => fiche?.calendrier },
  ],
};

const ACTEURS: Section = {
  sectionLabel: 'Acteurs',
  cols: () => [
    {
      colLabel: 'Personne pilote',
      cellValue: ({ fiche }) => joinNames(fiche?.pilotes),
    },
    {
      colLabel: 'Direction ou service pilote',
      cellValue: ({ fiche }) => joinNames(fiche?.services),
    },
    {
      colLabel: 'Structure pilote',
      cellValue: ({ fiche }) => joinNames(fiche?.structures),
    },
    {
      colLabel: 'Élu·e référent·e',
      cellValue: ({ fiche }) => joinNames(fiche?.referents),
    },
    {
      colLabel: 'Partenaires',
      cellValue: ({ fiche }) => joinNames(fiche?.partenaires),
    },
    {
      colLabel: 'Cibles',
      cellValue: ({ fiche }) => fiche?.cibles?.join(', '),
    },
    {
      colLabel: 'Participation citoyenne - type',
      cellValue: ({ fiche }) =>
        participationCitoyenneTypeToLabel[
          fiche?.participationCitoyenneType || ''
        ],
    },
    {
      colLabel: 'Participation citoyenne - détail',
      cellValue: ({ fiche }) => fiche?.participationCitoyenne,
    },
  ],
};

const ETAPES: Section = {
  sectionLabel: 'Étapes',
  cols: () => [
    {
      colLabel: "Nom et statut de l'étape",
      cellValue: ({ fiche }) =>
        fiche?.etapes
          ?.sort((a, b) => a.ordre - b.ordre)
          .map(
            ({ nom, realise }) =>
              `${nom} : ${realise ? 'réalisé' : 'non réalisé'} `
          )
          .join('\n') || '',
    },
  ],
};

const NOTES_DE_SUIVI: Section = {
  sectionLabel: 'Notes de suivi et points de vigilance',
  cols: ({ anneesNotes }) =>
    anneesNotes.map((annee) => ({
      colLabel: annee.toString(),
      cellValue: ({ fiche }) =>
        fiche?.notes?.find((n) => new Date(n.dateNote).getFullYear() === annee)
          ?.note,
    })),
};

const BUDGET: Section = {
  sectionLabel: 'Budget',
  cols: ({ maxFinanceurs }) => [
    {
      colLabel: 'Financements',
      cellValue: ({ fiche }) => fiche?.financements,
    },
    {
      colLabel: 'Budget prévisionnel total (€ TTC)', // TODO: à changer pour HT
      cellValue: ({ fiche }) => {
        // le type `numeric` pg doit être converti en nombre
        const n = parseFloat(fiche?.budgetPrevisionnel ?? '');
        return isNaN(n) ? '' : n;
      },
      cellProps: { numFmt: NUM_FORMAT_EURO },
    },
    ...Array.from({ length: maxFinanceurs }).flatMap((_, i) => [
      {
        colLabel: `Financeur ${i + 1}`,
        cellValue: ({ fiche }: { fiche: PlanFiche }) =>
          fiche?.financeurs?.[i]?.nom,
      },
      {
        colLabel: `Montant (€ TTC)`, // TODO: à changer pour HT
        cellValue: ({ fiche }: { fiche: PlanFiche }) =>
          fiche?.financeurs?.[i]?.montantTtc, // TODO: à changer si le nom du champ change
        cellProps: { numFmt: NUM_FORMAT_EURO },
      },
    ]),
  ],
};

const INDICATEURS: Section = {
  sectionLabel: 'Indicateurs de suivi',
  cols: () => [
    { colLabel: 'Objectifs', cellValue: ({ fiche }) => fiche?.objectifs },
    {
      colLabel: 'Résultats attendus',
      cellValue: ({ fiche }) => joinNames(fiche?.effetsAttendus),
    },
    {
      colLabel: 'Indicateurs liés',
      cellValue: ({ fiche }) => joinNames(fiche?.indicateurs),
    },
  ],
};

const INFO_LIEES: Section = {
  sectionLabel: 'Autres informations liées',
  cols: () => [
    {
      colLabel: 'Fiches des plans liées',
      cellValue: ({ fiche }) => joinNames(fiche?.fichesLiees, '\n'),
    },
    {
      colLabel: 'Mesures des référentiels liées',
      cellValue: ({ fiche }) =>
        fiche?.mesures
          ?.map((m) => `${m.referentiel} ${m.identifiant} - ${m.nom}`)
          .join('\n'),
    },
    {
      colLabel: 'Notes complémentaires',
      cellValue: ({ fiche }) => fiche?.notesComplementaires,
    },
    {
      colLabel: 'Documents et liens',
      cellValue: ({ fiche }) =>
        fiche?.docs
          ?.map((d) => d.filename || d.url)
          .filter(Boolean)
          .join('\n'),
    },
  ],
};

const INFO_CREATION_MODIFICATION: Section = {
  sectionLabel: 'Données de création et de modification',
  cols: () => [
    {
      colLabel: 'Date de création',
      cellValue: ({ fiche }) => formatDate(fiche?.createdAt),
    },
    { colLabel: 'Créé par', cellValue: ({ fiche }) => fiche?.createdByName },
    {
      colLabel: 'Date de dernière modification',
      cellValue: ({ fiche }) => formatDate(fiche?.modifiedAt),
    },
    {
      colLabel: 'Modifié par',
      cellValue: ({ fiche }) => fiche?.modifiedByName,
    },
  ],
};

const SECTIONS: Section[] = [
  PRESENTATION,
  ACCES,
  MISE_EN_OEUVRE,
  ACTEURS,
  ETAPES,
  NOTES_DE_SUIVI,
  BUDGET,
  INDICATEURS,
  INFO_LIEES,
  INFO_CREATION_MODIFICATION,
];

export const exportPlanXLSX = async (plan: Plan) => {
  // nom du fichier cible
  const exportedAt = format(new Date(), 'yyyy-MM-dd');
  const filename = `Export_${plan.root.nom}_${exportedAt}.xlsx`;

  const sections = getSections(plan);

  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet(
    normalizeWorksheetName("Plan d'action")
  );

  let currentCol = 1;
  sections.forEach(({ titreSection, cols }) => {
    const cell = worksheet.getCell(HEADER_ROW, currentCol);
    cell.value = titreSection;
    cell.style.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    worksheet.mergeCells(
      HEADER_ROW,
      currentCol,
      HEADER_ROW,
      currentCol + cols.length - 1
    );

    cols.forEach(({ colLabel, cellValues, cellProps }, colIndex) => {
      const cell = worksheet.getCell(SUB_HEADER_ROW, currentCol + colIndex);
      cell.value = colLabel;
      cell.style.fill = SUB_HEADER_FILL;

      cellValues.forEach((value, i) => {
        const cell = worksheet.getCell(
          SUB_HEADER_ROW + 1 + i,
          currentCol + colIndex
        );
        cell.value = value;
        if (cellProps) {
          Object.assign(cell, cellProps);
        }
      });
    });

    currentCol += cols.length;
  });

  // applique les styles
  for (let colIndex = 1; colIndex <= currentCol; colIndex++) {
    const col = worksheet.getColumn(colIndex);
    col.width = 60;
    col.alignment = { wrapText: true };
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return { buffer, filename };
};

// génère la liste des sections à partir des données du plan
const getSections = (plan: Plan) =>
  SECTIONS.map(({ sectionLabel: titreSection, cols }) => ({
    titreSection,
    cols: cols(plan)
      .map(({ colLabel, cellValue, cellProps }) => ({
        colLabel,
        cellProps,
        cellValues: plan.rows.map((row) => cellValue(row)),
      }))
      // enlève les colonnes pour lesquelles toutes les valeurs sont vides
      .filter(
        ({ cellValues }) =>
          cellValues.filter((v) => isNotNil(v) && v !== '').length !== 0
      ),
  }))
    // enlève les sections qui n'ont pas de colonnes
    .filter(({ cols }) => cols.length);
