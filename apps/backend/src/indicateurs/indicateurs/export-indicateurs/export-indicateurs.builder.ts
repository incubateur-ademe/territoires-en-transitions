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

/** Regroupement des valeurs d'un indicateur : la saisie de la collectivité et
 * les valeurs open-data ventilées par source. */
type IndicateurValeurs = {
  collectivite: IndicateurValeurAvecMetadonnesDefinition[];
  parSource: Map<string, IndicateurValeurAvecMetadonnesDefinition[]>;
};

/** Libellé de la colonne Source pour la ligne de saisie de la collectivité. */
const SOURCE_COLLECTIVITE = 'Collectivité';

const FIXED_HEADERS = [
  'Identifiant',
  "Nom de l'indicateur",
  'Indicateur parent',
  'Unité',
  'Pilote',
  'Direction ou service pilote',
  'Commentaire',
  'Source',
] as const;

/** Années effectivement présentes, séparées par type de valeur. Une année
 * n'apparaît que si au moins une valeur (toutes lignes confondues) l'alimente. */
type YearsByType = {
  resultat: number[];
  objectif: number[];
};

/**
 * Construit une feuille unique consolidée dans le classeur :
 * - Une ligne par indicateur pour la saisie de la collectivité (parent puis
 *   chaque enfant sur sa propre ligne)
 * - Une ligne supplémentaire par source open-data disposant de valeurs
 * - Colonnes dynamiques `<année> Résultat` / `<année> Objectif`, créées
 *   uniquement pour les années comportant au moins une valeur du type concerné
 * - En-tête figé (freeze panes)
 */
export function buildConsolidatedSheet(
  workbook: Workbook,
  parents: ParentRow[],
  indicateursValeurs: IndicateurValeurAvecMetadonnesDefinition[],
  sourceLabels: Map<string, string> = new Map()
): void {
  const worksheet = workbook.addWorksheet('Indicateurs');

  // Années réellement renseignées (saisie collectivité + open-data), séparées
  // par type : une colonne n'est créée que si elle contient au moins une valeur.
  const years = collectYears(indicateursValeurs);

  addHeaderRow(worksheet, years);

  // Index des valeurs par identifiant d'indicateur, séparant saisie
  // collectivité et sources open-data.
  const valeursByIndicateurId = indexValeurs(indicateursValeurs);

  for (const parent of parents) {
    addIndicateurRows(
      worksheet,
      parent,
      null,
      years,
      valeursByIndicateurId,
      sourceLabels
    );

    for (const enfant of parent.enfants ?? []) {
      addIndicateurRows(
        worksheet,
        {
          ...enfant,
          unite: parent.unite, // héritage de l'unité du parent
          pilotes: [],
          services: [],
          commentaire: null,
        },
        parent.titre,
        years,
        valeursByIndicateurId,
        sourceLabels
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
): YearsByType {
  const resultat = new Set<number>();
  const objectif = new Set<number>();
  for (const v of indicateursValeurs) {
    const annee = new Date(v.indicateur_valeur.dateValeur).getFullYear();
    if (v.indicateur_valeur.resultat !== null) resultat.add(annee);
    if (v.indicateur_valeur.objectif !== null) objectif.add(annee);
  }
  return {
    resultat: [...resultat].sort((a, b) => a - b),
    objectif: [...objectif].sort((a, b) => a - b),
  };
}

function indexValeurs(
  indicateursValeurs: IndicateurValeurAvecMetadonnesDefinition[]
): Map<number, IndicateurValeurs> {
  const map = new Map<number, IndicateurValeurs>();
  for (const v of indicateursValeurs) {
    const id = v.indicateur_definition?.id;
    if (!id) continue;
    const entry = map.get(id) ?? {
      collectivite: [],
      parSource: new Map<string, IndicateurValeurAvecMetadonnesDefinition[]>(),
    };
    const metadonnee = v.indicateur_source_metadonnee;
    if (metadonnee) {
      const bucket = entry.parSource.get(metadonnee.sourceId) ?? [];
      bucket.push(v);
      entry.parSource.set(metadonnee.sourceId, bucket);
    } else {
      entry.collectivite.push(v);
    }
    map.set(id, entry);
  }
  return map;
}

function addHeaderRow(worksheet: Worksheet, years: YearsByType): void {
  worksheet.addRow([
    ...FIXED_HEADERS,
    ...years.resultat.map((y) => `${y} Résultat`),
    ...years.objectif.map((y) => `${y} Objectif`),
  ]);
}

/**
 * Ajoute la ligne de saisie de la collectivité puis, quand elles existent, une
 * ligne par source open-data (résultats et/ou objectifs).
 */
function addIndicateurRows(
  worksheet: Worksheet,
  indicator: RowData,
  parentTitre: string | null,
  years: YearsByType,
  valeursByIndicateurId: Map<number, IndicateurValeurs>,
  sourceLabels: Map<string, string>
): void {
  const valeurs = valeursByIndicateurId.get(indicator.id);

  // Ligne de la collectivité : toujours présente (colonnes valeurs vides si
  // aucune saisie), elle porte les métadonnées de l'indicateur (pilote, etc.).
  addValeursRow(
    worksheet,
    indicator,
    parentTitre,
    SOURCE_COLLECTIVITE,
    valeurs?.collectivite ?? [],
    years,
    { withMeta: true }
  );

  // Lignes open-data : une par source disposant d'au moins une valeur.
  const sources = [...(valeurs?.parSource.entries() ?? [])].sort(([a], [b]) =>
    a.localeCompare(b)
  );
  for (const [sourceId, sourceValeurs] of sources) {
    addValeursRow(
      worksheet,
      indicator,
      parentTitre,
      sourceLabels.get(sourceId) ?? sourceId,
      sourceValeurs,
      years,
      { withMeta: false }
    );
  }
}

function addValeursRow(
  worksheet: Worksheet,
  indicator: RowData,
  parentTitre: string | null,
  source: string,
  valeurs: IndicateurValeurAvecMetadonnesDefinition[],
  years: YearsByType,
  { withMeta }: { withMeta: boolean }
): void {
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
    // Pilote / service / commentaire ne concernent que la saisie collectivité.
    withMeta ? indicator.pilotes.map((p) => p.nom).join(', ') : '',
    withMeta ? indicator.services.map((s) => s.nom).join(', ') : '',
    withMeta ? indicator.commentaire ?? '' : '',
    source,
    ...years.resultat.map((y) => resultatByYear.get(y) ?? null),
    ...years.objectif.map((y) => objectifByYear.get(y) ?? null),
  ]);
}
