import { PersonneTagOrUser, Tag } from '@tet/domain/collectivites';
import { Workbook, Worksheet } from 'exceljs';
import {
  adjustColumnWidth,
  BOLD,
} from '../../../utils/excel/export-excel.utils';
import { IndicateurValeurAvecMetadonnesDefinition } from '../../valeurs/indicateur-valeur.table';

type EnfantRow = {
  id: number;
  identifiantReferentiel: string | null;
  titre: string;
};

type RowData = EnfantRow & {
  unite: string;
  pilotes: PersonneTagOrUser[];
  services: Tag[];
  commentaire: string | null;
};

type ParentRow = RowData & {
  enfants: EnfantRow[];
};

const FIXED_HEADERS = [
  'Identifiant',
  "Nom de l'indicateur",
  'Indicateur parent',
  'Unité',
  'Pilotes',
  'Services',
  'Commentaire',
] as const;

/**
 * Construit une feuille unique consolidée dans le classeur :
 * - Une ligne par indicateur (parent puis chaque enfant sur sa propre ligne)
 * - Colonnes dynamiques `Résultat <année>` / `Objectif <année>` sur l'union des années
 * - En-tête figé (freeze panes)
 */
export function buildConsolidatedSheet(
  workbook: Workbook,
  parents: ParentRow[],
  indicateursValeurs: IndicateurValeurAvecMetadonnesDefinition[]
): void {
  const worksheet = workbook.addWorksheet('Indicateurs');

  // Union des années sur les valeurs saisies par l'utilisateur (hors open-data)
  const allYears = collectYears(indicateursValeurs);

  addHeaderRow(worksheet, allYears);

  // Index des valeurs utilisateur par identifiant d'indicateur
  const valeursByIndicateurId = indexValeurs(indicateursValeurs);

  for (const parent of parents) {
    addIndicateurRow(worksheet, parent, null, allYears, valeursByIndicateurId);

    for (const enfant of parent.enfants ?? []) {
      addIndicateurRow(
        worksheet,
        {
          ...enfant,
          unite: parent.unite, // héritage de l'unité du parent
          pilotes: [],
          services: [],
          commentaire: null,
        },
        parent.titre,
        allYears,
        valeursByIndicateurId
      );
    }
  }

  worksheet.getRow(1).font = BOLD;
  // Figer la ligne d'en-tête pour la lisibilité sur les exports volumineux
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  adjustColumnWidth(worksheet);
}

// --- helpers privés ---

function collectYears(
  indicateursValeurs: IndicateurValeurAvecMetadonnesDefinition[]
): number[] {
  const years = new Set<number>();
  for (const v of indicateursValeurs) {
    // Exclure les valeurs open-data (source externe)
    if (v.indicateur_source_metadonnee) continue;
    years.add(new Date(v.indicateur_valeur.dateValeur).getFullYear());
  }
  return [...years].sort((a, b) => a - b);
}

function indexValeurs(
  indicateursValeurs: IndicateurValeurAvecMetadonnesDefinition[]
): Map<number, IndicateurValeurAvecMetadonnesDefinition[]> {
  const map = new Map<number, IndicateurValeurAvecMetadonnesDefinition[]>();
  for (const v of indicateursValeurs) {
    if (v.indicateur_source_metadonnee) continue;
    const id = v.indicateur_definition?.id;
    if (!id) continue;
    const bucket = map.get(id) ?? [];
    bucket.push(v);
    map.set(id, bucket);
  }
  return map;
}

function addHeaderRow(worksheet: Worksheet, allYears: number[]): void {
  worksheet.addRow([
    ...FIXED_HEADERS,
    ...allYears.map((y) => `Résultat ${y}`),
    ...allYears.map((y) => `Objectif ${y}`),
  ]);
}

function addIndicateurRow(
  worksheet: Worksheet,
  indicator: RowData,
  parentTitre: string | null,
  allYears: number[],
  valeursByIndicateurId: Map<number, IndicateurValeurAvecMetadonnesDefinition[]>
): void {
  const valeurs = valeursByIndicateurId.get(indicator.id) ?? [];

  const resultatByYear = new Map<number, number | null>();
  const objectifByYear = new Map<number, number | null>();

  for (const v of valeurs) {
    const annee = new Date(v.indicateur_valeur.dateValeur).getFullYear();
    if (v.indicateur_valeur.resultat !== null) {
      resultatByYear.set(annee, v.indicateur_valeur.resultat);
    }
    if (v.indicateur_valeur.objectif !== null) {
      objectifByYear.set(annee, v.indicateur_valeur.objectif);
    }
  }

  const titre = parentTitre ? `  ${indicator.titre}` : indicator.titre;

  worksheet.addRow([
    indicator.identifiantReferentiel ?? String(indicator.id),
    titre,
    parentTitre ?? '',
    indicator.unite,
    indicator.pilotes.map((p) => p.nom).join(', '),
    indicator.services.map((s) => s.nom).join(', '),
    indicator.commentaire ?? '',
    ...allYears.map((y) => resultatByYear.get(y) ?? null),
    ...allYears.map((y) => objectifByYear.get(y) ?? null),
  ]);
}
