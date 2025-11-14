/**
 * Déclaration des différentes sections de l'export
 */
import { formatBudgets } from '@/backend/plans/fiches/export/format';
import {
  Plan,
  PlanFiche,
  PlanRow,
} from '@/backend/plans/fiches/plan-actions.service';
import { formatDate } from '@/backend/utils/excel/export-excel.utils';
import { htmlToText } from '@/domain/utils';
import { getDepthLabel, participationCitoyenneTypeToLabel } from './utils';

// l'export est organisé en sections ou groupes de colonnes
type Section = {
  /** titre de la section */
  sectionLabel: string;
  /** liste des colonnes (ou des champs dans l'export doc) */
  cols: (plan: Plan) => SectionCol[];
};

type SectionCol = {
  /** libellé d'une colonne (ou d'un champ dans l'export doc) */
  colLabel: string;
  /** renvoie la valeur d'une cellule/champ pour une fiche donnée */
  cellValue: (row: PlanRow) => string | string[] | number | undefined | null;
  /** option de formatage complémentaire pour certains champs */
  format?: 'euro';
  /** colonne exclue de l'export docx */
  excludeFromDocx?: boolean;
};

const getNames = (items: Array<{ nom: string | null }> | null | undefined) => {
  return items?.map(({ nom }) => nom || '') || '';
};

const PRESENTATION: Section = {
  sectionLabel: "Présentation de l'action",
  cols: ({ maxDepth }) => [
    ...Array.from({ length: maxDepth }).map((_, i) => ({
      colLabel: getDepthLabel(i + 1),
      cellValue: ({ path, depth, nom }: PlanRow) =>
        depth === 0 && i === 0 ? '(Fiche non classée)' : [...path, nom][i],
      excludeFromDocx: true,
    })),
    {
      colLabel: 'Titre de la fiche action',
      cellValue: ({ fiche }: PlanRow) => fiche?.titre,
      excludeFromDocx: true,
    },
    {
      colLabel: 'Descriptif',
      cellValue: ({ fiche }: PlanRow) => htmlToText(fiche?.description || ''),
    },
    {
      colLabel: 'Thématique principale',
      cellValue: ({ fiche }: PlanRow) => getNames(fiche?.thematiques),
    },
    {
      colLabel: 'Sous-thématiques',
      cellValue: ({ fiche }: PlanRow) => getNames(fiche?.sousThematiques),
    },
    {
      colLabel: 'Tags de suivi',
      cellValue: ({ fiche }: PlanRow) => getNames(fiche?.libreTags),
    },
    {
      colLabel: 'Moyens humains et techniques',
      cellValue: ({ fiche }: PlanRow) => htmlToText(fiche?.ressources || ''),
    },
    {
      colLabel: 'Instances de gouvernance',
      cellValue: ({ fiche }: PlanRow) =>
        htmlToText(fiche?.instanceGouvernance || ''),
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
  sectionLabel: 'Modalités de mise en œuvre',
  cols: () => [
    { colLabel: 'Statut', cellValue: ({ fiche }) => fiche?.statut },
    {
      colLabel: 'Niveau de priorité',
      cellValue: ({ fiche }) => fiche?.priorite,
    },
    {
      colLabel: 'Temps de mise en œuvre',
      cellValue: ({ fiche }) => fiche?.tempsDeMiseEnOeuvre?.nom,
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
      colLabel: "L'action se répète tous les ans",
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
      cellValue: ({ fiche }) => getNames(fiche?.pilotes),
    },
    {
      colLabel: 'Direction ou service pilote',
      cellValue: ({ fiche }) => getNames(fiche?.services),
    },
    {
      colLabel: 'Structure pilote',
      cellValue: ({ fiche }) => getNames(fiche?.structures),
    },
    {
      colLabel: 'Élu·e référent·e',
      cellValue: ({ fiche }) => getNames(fiche?.referents),
    },
    {
      colLabel: 'Partenaires',
      cellValue: ({ fiche }) => getNames(fiche?.partenaires),
    },
    {
      colLabel: 'Cibles',
      cellValue: ({ fiche }) => fiche?.cibles,
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
              `${nom} : ${realise ? 'réalisé' : 'non réalisé'}`
          ),
    },
  ],
};

const NOTES_DE_SUIVI: Section = {
  sectionLabel: 'Notes de suivi et points de vigilance',
  cols: ({ anneesNotes }) =>
    anneesNotes.map((annee) => ({
      colLabel: annee.toString(),
      cellValue: ({ fiche }) =>
        htmlToText(
          fiche?.notes
            ?.filter((n) => new Date(n.dateNote).getFullYear() === annee)
            .map((n) => n.note)
            .join('\n') || ''
        ),
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
      colLabel: 'Budgets de fonctionnement',
      cellValue: ({ fiche }) =>
        formatBudgets(fiche, 'fonctionnement').join('\n'),
    },
    {
      colLabel: `Budgets d'investissement`,
      cellValue: ({ fiche }) =>
        formatBudgets(fiche, 'investissement').join('\n'),
    },
    ...Array.from({ length: maxFinanceurs }).flatMap((_, i) => [
      {
        colLabel: `Financeur ${i + 1}`,
        cellValue: ({ fiche }: { fiche: PlanFiche }) =>
          fiche?.financeurs?.[i]?.financeurTag.nom,
      },
      {
        colLabel: `Montant (TTC)`, // TODO: à changer pour HT
        cellValue: ({ fiche }: { fiche: PlanFiche }) =>
          fiche?.financeurs?.[i]?.montantTtc, // TODO: à changer si le nom du champ change
        format: 'euro' as const,
      },
    ]),
  ],
};

const INDICATEURS: Section = {
  sectionLabel: 'Indicateurs de suivi',
  cols: () => [
    {
      colLabel: 'Objectifs',
      cellValue: ({ fiche }) => htmlToText(fiche?.objectifs || ''),
    },
    {
      colLabel: 'Résultats attendus',
      cellValue: ({ fiche }) => getNames(fiche?.effetsAttendus),
    },
    {
      colLabel: 'Indicateurs liés',
      cellValue: ({ fiche }) =>
        fiche?.indicateurs?.map(
          ({ nom, unite }) => nom + (unite ? ` (${unite})` : '')
        ),
    },
  ],
};

const INFO_LIEES: Section = {
  sectionLabel: 'Autres informations liées',
  cols: () => [
    {
      colLabel: 'Fiches action',
      cellValue: ({ fiche }) => getNames(fiche?.fichesLiees),
    },
    {
      colLabel: 'Mesures des référentiels',
      cellValue: ({ fiche }) =>
        fiche?.mesures?.map(
          (m) => `${m.referentiel} ${m.identifiant} - ${m.nom}`
        ),
    },
    {
      colLabel: 'Notes complémentaires',
      cellValue: ({ fiche }) => htmlToText(fiche?.notesComplementaires || ''),
    },
    {
      colLabel: 'Documents et liens',
      cellValue: ({ fiche }) =>
        fiche?.docs
          ?.map((d) => d.filename || d.url)
          .filter(Boolean) as string[],
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
    {
      colLabel: 'Créé par',
      cellValue: ({ fiche }) =>
        fiche?.createdBy
          ? fiche?.createdBy?.prenom + ' ' + fiche?.createdBy?.nom
          : '',
    },
    {
      colLabel: 'Date de dernière modification',
      cellValue: ({ fiche }) => formatDate(fiche?.modifiedAt),
    },
    {
      colLabel: 'Modifié par',
      cellValue: ({ fiche }) =>
        fiche?.modifiedBy
          ? fiche?.modifiedBy?.prenom + ' ' + fiche?.modifiedBy?.nom
          : '',
    },
  ],
};

export const SECTIONS: Section[] = [
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
