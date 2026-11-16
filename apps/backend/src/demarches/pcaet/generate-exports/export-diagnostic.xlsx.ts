import { buildConsolidatedSheet } from '@tet/backend/indicateurs/indicateurs/export-indicateurs/export-indicateurs.builder';
import {
  adjustColumnWidth,
  ALIGN_LEFT_WRAP,
  BOLD,
  capitalize,
} from '@tet/backend/utils/excel/export-excel.utils';
import {
  DEMARCHE_PCAET_VULNERABILITE_NIVEAU_LABELS,
  type DemarchePcaetVulnerabiliteNiveau,
  type DemarchePcaetVulnerabiliteThematique,
  type PcaetDiagnostic,
  type PcaetDiagnosticVulnerabilite,
} from '@tet/domain/demarches';
import { Workbook } from 'exceljs';
import { toExportIndicateurs } from './to-export-indicateurs.adapter';

const VULNERABILITE_HEADERS = [
  'Thématique',
  'Sous-thématique',
  'Vulnérabilité actuelle',
  'Vulnérabilité 2050',
  'Vulnérabilité 2100',
  'Objectifs 2050',
  'Objectifs 2100',
];

/** Largeur des colonnes d'objectifs : du texte libre, renvoyé à la ligne. */
const OBJECTIFS_COLUMN_WIDTH = 60;

/**
 * Classeur des données de l'étape Diagnostic & Objectifs d'une démarche :
 * onglet « Indicateurs » (sans les colonnes de métadonnées, propres à la
 * fiche indicateur ; la colonne « Catégorie » reprend les titres de l'écran) et onglet « Vulnérabilité ».
 */
export const exportDiagnosticXLSX = async (diagnostic: PcaetDiagnostic) => {
  const workbook = new Workbook();

  const { parents, valeurs } = toExportIndicateurs(diagnostic);
  buildConsolidatedSheet(workbook, parents, valeurs, new Map(), {
    withMetaColumns: false,
    parentColumnHeader: 'Catégorie',
  });

  addVulnerabiliteWorksheet(workbook, diagnostic.vulnerabilite);

  return workbook.xlsx.writeBuffer();
};

const addVulnerabiliteWorksheet = (
  workbook: Workbook,
  vulnerabilite: PcaetDiagnosticVulnerabilite
) => {
  const worksheet = workbook.addWorksheet('Vulnérabilité');
  worksheet.addRow(VULNERABILITE_HEADERS);

  const lignesParThematique = new Map(
    vulnerabilite.lignes.map((ligne) => [ligne.thematiqueId, ligne])
  );

  for (const { thematique, parent } of orderThematiques(
    vulnerabilite.thematiques
  )) {
    const ligne = lignesParThematique.get(thematique.id);
    worksheet.addRow([
      parent?.label ?? thematique.label,
      parent ? thematique.label : '',
      formatNiveau(ligne?.niveauMaintenant),
      formatNiveau(ligne?.niveau2050),
      formatNiveau(ligne?.niveau2100),
      ligne?.objectifs2050 ?? '',
      ligne?.objectifs2100 ?? '',
    ]);
  }

  worksheet.getRow(1).font = BOLD;
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  adjustColumnWidth(worksheet);
  for (const colNumber of [6, 7]) {
    const column = worksheet.getColumn(colNumber);
    column.width = OBJECTIFS_COLUMN_WIDTH;
    column.alignment = ALIGN_LEFT_WRAP;
  }
};

/**
 * Même ordre qu'à l'écran : celui des thématiques, chaque sous-thématique
 * ramenée derrière sa parente. Une sous-thématique dont la parente n'est pas
 * servie remonte à la racine plutôt que de disparaître.
 */
const orderThematiques = (
  thematiques: DemarchePcaetVulnerabiliteThematique[]
): {
  thematique: DemarchePcaetVulnerabiliteThematique;
  parent: DemarchePcaetVulnerabiliteThematique | null;
}[] => {
  const parId = new Map(thematiques.map((t) => [t.id, t]));
  const isRattachee = (t: DemarchePcaetVulnerabiliteThematique) =>
    t.parentId !== null && parId.has(t.parentId);

  return thematiques
    .filter((t) => !isRattachee(t))
    .flatMap((racine) => [
      { thematique: racine, parent: null },
      ...thematiques
        .filter((t) => t.parentId === racine.id)
        .map((enfant) => ({ thematique: enfant, parent: racine })),
    ]);
};

const formatNiveau = (
  niveau: DemarchePcaetVulnerabiliteNiveau | null | undefined
) =>
  niveau ? capitalize(DEMARCHE_PCAET_VULNERABILITE_NIVEAU_LABELS[niveau]) : '';
