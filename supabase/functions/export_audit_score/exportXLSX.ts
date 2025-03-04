/**
 * Export des scores et statut avant/après audit au format Excel
 */
import Excel from 'https://esm.sh/exceljs@4.3.0';
import * as Utils from '../_shared/exportUtils.ts';
import {
  TActionReferentiel,
  TPreuve,
} from '../_shared/fetchActionsReferentiel.ts';
import { formatActionStatut } from '../_shared/formatActionStatut.ts';
import { TSupabaseClient } from '../_shared/getSupabaseClient.ts';
import { Enums } from '../_shared/typeUtils.ts';
import * as Constants from './constants.ts';
import { fetchData, TComparaisonScoreAudit } from './fetchData.ts';

export type TExportArgs = {
  collectivite_id: number;
  referentiel: Enums<'referentiel'>;
};

export const exportXLSX = async (
  supabaseClient: TSupabaseClient,
  { collectivite_id, referentiel }: TExportArgs
) => {
  // charge les données
  const data = await fetchData(supabaseClient, collectivite_id, referentiel);
  const {
    actionsParId,
    auditeurs,
    collectivite,
    commentairesParActionId,
    getPreuvesParActionId,
    scores,
  } = data;

  // crée le classeur et la feuille de calcul
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet(
    `Export audit ${referentiel.toUpperCase()}`
  );

  // ajoute les colonnes avec une largeur par défaut et quelques exceptions
  worksheet.columns = new Array(Constants.COL_INDEX.docs + 1).fill({
    width: 12,
  });
  worksheet.getColumn(Constants.COL_INDEX.intitule).width = 50;
  worksheet.getColumn(Constants.COL_INDEX.commentaires).width = 50;
  worksheet.getColumn(Constants.COL_INDEX.docs).width = 50;

  // génère les lignes d'en-tête
  const headerRows = [
    [collectivite!.nom],
    [
      'Audit',
      auditeurs?.map(({ prenom, nom }) => `${prenom} ${nom}`).join(' / '),
    ],
    ["Date d'export", new Date()],
    // 2 lignes vides
    [],
    [],
    // en-tête du tableau de données
    [
      ...Utils.makeEmptyCells(Constants.COL_INDEX.points_max_referentiel),
      'Proposé avant audit dans la plateforme',
      ...Utils.makeEmptyCells(Utils.SCORE_HEADER_LABELS.length - 1),
      'Audité dans la plateforme',
    ],
    Constants.COLUMN_LABELS,
  ];

  // génère les lignes de données
  const dataRows = scores.map((score) =>
    getRowValues(
      referentiel,
      score,
      actionsParId[score.action_id],
      commentairesParActionId[score.action_id]?.commentaire,
      getPreuvesParActionId(score.action_id)
    )
  );

  // ajoute les lignes d'en-tête et de données à la feuille de calcul
  worksheet.addRows([...headerRows, ...dataRows]);

  // index des lignes
  const rowIndex = {
    // index des 2 lignes d'en-tête du tableau
    tableHeader1: headerRows.length - 1,
    tableHeader2: headerRows.length,
    // index de la 1ère ligne de données
    dataStart: headerRows.length + 1,
  };

  // fusionne certaines cellules
  worksheet.mergeCells('A1:B1'); // nom de la collectivité
  // 1ère ligne d'en-tête des scores avant/après audit
  worksheet.mergeCells(
    rowIndex.tableHeader1,
    Constants.COL_INDEX.pre_audit.points_max_personnalises,
    rowIndex.tableHeader1,
    Constants.COL_INDEX.pre_audit.statut
  );
  worksheet.mergeCells(
    rowIndex.tableHeader1,
    Constants.COL_INDEX.courant.points_max_personnalises,
    rowIndex.tableHeader1,
    Constants.COL_INDEX.courant.statut
  );

  // ajoute des styles à certaines colonnes et cellules
  worksheet.getColumn(Constants.COL_INDEX.intitule).alignment =
    Utils.ALIGN_LEFT_WRAP;
  worksheet.getColumn(Constants.COL_INDEX.commentaires).alignment =
    Utils.ALIGN_LEFT_WRAP;
  worksheet.getColumn(Constants.COL_INDEX.docs).alignment =
    Utils.ALIGN_LEFT_WRAP;
  worksheet.getColumn(Constants.COL_INDEX.points_max_referentiel).font =
    Utils.ITALIC;
  if (Constants.COL_INDEX.phase) {
    worksheet.getColumn(Constants.COL_INDEX.phase).alignment =
      Utils.ALIGN_CENTER;
  }
  worksheet.getCell('A1').fill = Utils.FILL.grey;
  worksheet.getCell('B2').fill = Utils.FILL.yellow;
  worksheet.getCell('B3').fill = Utils.FILL.yellow;
  worksheet.getCell('B3').numFmt = 'dd/mm/yyyy';
  worksheet.getCell(
    rowIndex.tableHeader1,
    Constants.COL_INDEX.pre_audit.points_max_personnalises
  ).style = Utils.HEADING1;
  worksheet.getCell(
    rowIndex.tableHeader1,
    Constants.COL_INDEX.courant.points_max_personnalises
  ).style = Utils.HEADING1;
  Utils.setCellsStyle(
    worksheet,
    rowIndex.tableHeader2,
    Constants.COL_INDEX.arbo,
    Constants.COL_INDEX.docs,
    Utils.HEADING2
  );
  Utils.setCellsStyle(
    worksheet,
    rowIndex.tableHeader2,
    Constants.COL_INDEX.pre_audit.points_max_personnalises,
    Constants.COL_INDEX.commentaires - 1,
    Utils.HEADING_SCORES
  );
  worksheet.getCell(
    rowIndex.tableHeader2,
    Constants.COL_INDEX.points_max_referentiel
  ).font = { bold: true, italic: true };
  worksheet.getCell(
    rowIndex.tableHeader2,
    Constants.COL_INDEX.pre_audit.points_max_personnalises
  ).border.left = Utils.BORDER_MEDIUM;
  worksheet.getCell(
    rowIndex.tableHeader2,
    Constants.COL_INDEX.courant.statut
  ).border.right = Utils.BORDER_MEDIUM;

  // applique les styles aux lignes de données
  scores.forEach(({ action_id }, index) => {
    const r = rowIndex.dataStart + index;
    const row = worksheet.getRow(r);

    if (action_id === referentiel) {
      // ligne "total"
      Utils.setCellsStyle(
        worksheet,
        r,
        Constants.COL_INDEX.arbo,
        Constants.COL_INDEX.docs,
        {
          font: Utils.BOLD,
        }
      );
    } else {
      // niveau de profondeur (case plier/déplier)
      const action = actionsParId[action_id];
      if (action?.depth > 1) {
        row.outlineLevel = action.depth;
      }
      // couleur de fond
      const color = Utils.getRowColor(action, referentiel);
      if (color) row.fill = Utils.makeSolidFill(color);
    }

    // formatage numérique des points/scores
    Utils.setCellNumFormat(
      row.getCell(Constants.COL_INDEX.pre_audit.points_max_personnalises - 1)
    );
    Utils.setScoreFormats(
      row,
      Constants.COL_INDEX.pre_audit.points_max_personnalises
    );
    Utils.setScoreFormats(
      row,
      Constants.COL_INDEX.courant.points_max_personnalises
    );
  });

  // exporte le fichier modifié
  return workbook.xlsx.writeBuffer();
};

// génère une ligne de la feuille de calcul
const getRowValues = (
  referentiel: Enums<'referentiel'>,
  { action_id, pre_audit, courant }: TComparaisonScoreAudit,
  action?: TActionReferentiel,
  commentaire?: string,
  preuves?: TPreuve[]
) => {
  const values = [
    // id
    action_id === referentiel ? 'Total' : action?.identifiant,
    // intitulé
    action_id === referentiel ? '' : action?.nom,
    // phase
    Utils.capitalize(action?.phase),

    // points max réf.
    pre_audit.points_max_referentiel,

    // score et statut avant audit
    pre_audit.points_max_personnalises,
    pre_audit.points_realises,
    pre_audit.score_realise,
    pre_audit.points_programmes,
    pre_audit.score_programme,
    action && !action.have_children ? formatActionStatut(pre_audit) : '',

    // score et statut après audit
    courant.points_max_personnalises,
    courant.points_realises,
    courant.score_realise,
    courant.points_programmes,
    courant.score_programme,
    action && !action.have_children ? formatActionStatut(courant) : '',

    // commentaires et documents,
    commentaire || '',
    Utils.formatPreuves(preuves) || '',
  ];

  return values;
};
