import {
  BOLD,
  FILL,
  FORMAT_PERCENT,
  normalizeWorksheetName,
  setNumValue,
} from '@tet/backend/utils/excel/export-excel.utils';
import { DEBUT_HISTORIQUE_STATUTS, Statut } from '@tet/domain/plans';
import { CellValue, Workbook, Worksheet } from 'exceljs';
import { AvancementAxe } from '../get-avancement-par-axe/get-avancement-par-axe.service';
import { EvolutionStatuts } from '../get-evolution-statuts/get-evolution-statuts.service';
import { VueEnsemble } from '../get-vue-ensemble/get-vue-ensemble.service';

export type SuiviPlanExportEntete = {
  titre: string;
  planNom: string;
  thematiques: string[];
  filtres: [string, string][];
  exporteLe: string;
};

const SANS_STATUT = 'Sans statut';
const NUM_FORMAT_EVOLUTION = '+0;-0;"="';

const formatDateIso = (date: string) => date.split('-').reverse().join('/');

const labelStatut = (statut: Statut | null) => statut ?? SANS_STATUT;

const toPercent = (avancement: number) => Math.round(avancement) / 100;

const createWorksheet = (
  entete: SuiviPlanExportEntete,
  lignes: [string, CellValue][] = []
) => {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet(normalizeWorksheetName(entete.titre));
  worksheet.addRow([entete.titre]).font = BOLD;
  [
    ['Plan', entete.planNom],
    [
      'Thématiques',
      entete.thematiques.length ? entete.thematiques.join(', ') : 'Toutes',
    ],
    ...entete.filtres,
    ['Exporté le', entete.exporteLe],
    ...lignes,
  ].forEach((ligne) => {
    worksheet.addRow(ligne).getCell(1).font = BOLD;
  });
  worksheet.addRow([]);
  return { workbook, worksheet };
};

const addHeaderRow = (worksheet: Worksheet, values: string[]) => {
  const row = worksheet.addRow(values);
  row.eachCell((cell) => {
    cell.font = BOLD;
    cell.fill = FILL.lightgrey;
  });
};

const setColumnWidths = (worksheet: Worksheet, widths: number[]) => {
  widths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });
};

export const buildVueEnsembleXlsx = (
  entete: SuiviPlanExportEntete,
  data: VueEnsemble
) => {
  const { workbook, worksheet } = createWorksheet(entete);

  setNumValue(
    worksheet.addRow(['Avancement du plan']).getCell(2),
    toPercent(data.avancement),
    FORMAT_PERCENT
  );
  worksheet.addRow(['Nombre de fiches', data.total]);
  worksheet.addRow(['Dont abandonnées', data.abandonnees]);
  worksheet.addRow([
    'En cours sans avancement renseigné',
    data.enCoursSansAvancement,
  ]);
  worksheet.addRow([]);

  addHeaderRow(worksheet, ['Statut', 'Nombre de fiches']);
  data.repartitionParStatut.forEach(({ statut, count }) => {
    worksheet.addRow([labelStatut(statut), count]);
  });

  setColumnWidths(worksheet, [40, 30]);
  return workbook.xlsx.writeBuffer();
};

export const buildAvancementParAxeXlsx = (
  entete: SuiviPlanExportEntete,
  axes: AvancementAxe[]
) => {
  const { workbook, worksheet } = createWorksheet(entete);

  addHeaderRow(worksheet, [
    'Axe',
    'Avancement',
    'Nombre de fiches',
    'Fiches réalisées',
  ]);

  const addAxe = (axe: AvancementAxe, niveau: number) => {
    const row = worksheet.addRow([
      axe.nom ?? 'Sans titre',
      null,
      axe.total,
      axe.realisees,
    ]);
    row.getCell(1).alignment = { indent: niveau * 2 };
    row.outlineLevel = niveau;
    setNumValue(row.getCell(2), toPercent(axe.avancement), FORMAT_PERCENT);
    axe.sousAxes.forEach((sousAxe) => addAxe(sousAxe, niveau + 1));
  };
  axes.forEach((axe) => addAxe(axe, 0));

  setColumnWidths(worksheet, [60, 14, 18, 18]);
  return workbook.xlsx.writeBuffer();
};

export const buildEvolutionStatutsXlsx = (
  entete: SuiviPlanExportEntete,
  data: EvolutionStatuts,
  inclureActionsContinues: boolean
) => {
  const debut = formatDateIso(data.dateDebut);
  const fin = formatDateIso(data.dateFin);
  const { workbook, worksheet } = createWorksheet(entete, [
    ['Période', `Du ${debut} au ${fin}`],
    [
      'Actions continues',
      inclureActionsContinues
        ? `Incluses (${data.actionsContinues})`
        : `Retirées (${data.actionsContinues})`,
    ],
    ...(data.dateDebutRamenee
      ? ([
          [
            'Historique',
            `Les statuts ne sont historisés que depuis le ${formatDateIso(
              DEBUT_HISTORIQUE_STATUTS
            )} : la date de début y est ramenée.`,
          ],
        ] as [string, CellValue][])
      : []),
  ]);

  addHeaderRow(worksheet, ['Statut', `Au ${debut}`, `Au ${fin}`, 'Évolution']);
  const addEvolutionRow = (
    libelle: string,
    valeurDebut: number,
    valeurFin: number
  ) => {
    const row = worksheet.addRow([
      libelle,
      valeurDebut,
      valeurFin,
      valeurFin - valeurDebut,
    ]);
    row.getCell(4).numFmt = NUM_FORMAT_EVOLUTION;
    return row;
  };
  data.parStatut
    .filter(({ statut, debut, fin }) => statut !== null || debut + fin > 0)
    .forEach(({ statut, debut, fin }) => {
      addEvolutionRow(labelStatut(statut), debut, fin);
    });
  addEvolutionRow('Total', data.totalDebut, data.totalFin).font = BOLD;
  worksheet.addRow([]);
  worksheet.addRow([
    `Fiches créées depuis le ${debut}`,
    data.creeesDepuisDebut,
  ]);

  setColumnWidths(worksheet, [40, 16, 16, 12]);
  return workbook.xlsx.writeBuffer();
};
