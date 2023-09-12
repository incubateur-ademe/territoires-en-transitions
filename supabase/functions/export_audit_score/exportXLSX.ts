/**
 * Export des scores et statut avant/après audit au format Excel
 */
import { Workbook, Row } from 'https://esm.sh/exceljs@4.3.0';
import { TSupabaseClient } from '../_shared/getSupabaseClient.ts';
import { Enums } from '../_shared/typeUtils.ts';
import {
  setCellNumFormat,
  FORMAT_PERCENT,
  makeSolidFill,
  setCellsStyle,
  makeEmptyCells,
  capitalize,
} from '../_shared/exportUtils.ts';
import {
  ALIGN_CENTER,
  ALIGN_LEFT_WRAP,
  BG_COLOR3,
  BG_COLORS,
  BOLD,
  BORDER_MEDIUM,
  COLUMN_LABELS,
  Fills,
  HEADING1,
  HEADING2,
  HEADING_SCORES,
  ITALIC,
  SCORE_HEADER_LABELS,
} from './constants.ts';
import { formatActionStatut } from '../_shared/formatActionStatut.ts';
import {
  fetchData,
  TActionReferentiel,
  TComparaisonScoreAudit,
  TPreuve,
} from './fetchData.ts';

export const exportXLSX = async (
  supabaseClient: TSupabaseClient,
  collectivite_id: number,
  referentiel: Enums<'referentiel'>
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
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet(
    `Export audit ${referentiel.toUpperCase()}`
  );

  // offset sur les index de cellules : la colonne "phase" n'est présente que pour CAE
  const colOffset = referentiel === 'cae' ? 0 : -1;

  // index des colonnes
  const colIndex = getColIndex(colOffset);

  // ajoute les colonnes avec une largeur par défaut et quelques exceptions
  worksheet.columns = new Array(colIndex.docs + 1).fill({ width: 12 });
  worksheet.getColumn(colIndex.intitule).width = 50;
  worksheet.getColumn(colIndex.commentaires).width = 50;
  worksheet.getColumn(colIndex.docs).width = 50;

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
      ...makeEmptyCells(colIndex.pre_audit - 1),
      'Proposé avant audit dans la plateforme',
      ...makeEmptyCells(SCORE_HEADER_LABELS.length - 1),
      'Audité dans la plateforme',
    ],
    getColumnLabels(referentiel),
  ];

  // index des lignes
  const rowIndex = {
    // index des 2 lignes d'en-tête du tableau
    tableHeader1: headerRows.length - 1,
    tableHeader2: headerRows.length,
    // index de la 1ère ligne de données
    dataStart: headerRows.length + 1,
  };

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

  // ajoute les lignes à la feuille de calcul
  worksheet.addRows([...headerRows, ...dataRows]);

  // fusionne certaines cellules
  worksheet.mergeCells('A1:B1'); // nom de la collectivité
  // 1ère ligne d'en-tête des scores avant/après audit
  worksheet.mergeCells(
    rowIndex.tableHeader1,
    colIndex.pre_audit,
    rowIndex.tableHeader1,
    colIndex.pre_audit + SCORE_HEADER_LABELS.length - 1
  );
  worksheet.mergeCells(
    rowIndex.tableHeader1,
    colIndex.courant,
    rowIndex.tableHeader1,
    colIndex.courant + SCORE_HEADER_LABELS.length - 1
  );

  // ajoute des styles
  worksheet.getColumn(colIndex.intitule).alignment = ALIGN_LEFT_WRAP;
  worksheet.getColumn(colIndex.commentaires).alignment = ALIGN_LEFT_WRAP;
  worksheet.getColumn(colIndex.docs).alignment = ALIGN_LEFT_WRAP;
  worksheet.getColumn(colIndex.points_max_referentiel).font = ITALIC;
  if (colIndex.phase) {
    worksheet.getColumn(colIndex.phase).alignment = ALIGN_CENTER;
  }
  worksheet.getCell('A1').fill = Fills.grey;
  worksheet.getCell('B2').fill = Fills.yellow;
  worksheet.getCell('B3').fill = Fills.yellow;
  worksheet.getCell('B3').numFmt = 'dd/mm/yyyy';
  worksheet.getCell(rowIndex.tableHeader1, colIndex.pre_audit).style = HEADING1;
  worksheet.getCell(rowIndex.tableHeader1, colIndex.courant).style = HEADING1;
  setCellsStyle(
    worksheet,
    rowIndex.tableHeader2,
    colIndex.arbo,
    colIndex.docs,
    HEADING2
  );
  setCellsStyle(
    worksheet,
    rowIndex.tableHeader2,
    colIndex.pre_audit,
    colIndex.commentaires - 1,
    HEADING_SCORES
  );
  worksheet.getCell(
    rowIndex.tableHeader2,
    colIndex.points_max_referentiel
  ).font = { bold: true, italic: true };
  worksheet.getCell(rowIndex.tableHeader2, colIndex.pre_audit).border.left =
    BORDER_MEDIUM;
  worksheet.getCell(rowIndex.tableHeader2, 16 + colOffset).border.right =
    BORDER_MEDIUM;

  // applique les styles au lignes de données
  scores.forEach(({ action_id }, index) => {
    const r = rowIndex.dataStart + index;
    const row = worksheet.getRow(r);

    if (action_id === referentiel) {
      // ligne "total"
      setCellsStyle(worksheet, r, colIndex.arbo, colIndex.docs, { font: BOLD });
    } else {
      // niveau de profondeur (case plier/déplier)
      const action = actionsParId[action_id];
      if (action?.depth > 1) {
        row.outlineLevel = action?.depth;
      }
      // couleur de fond
      const color = getRowColor(action);
      if (color) row.fill = makeSolidFill(color);
    }

    // formatage numérique des points/scores
    setCellNumFormat(row.getCell(colIndex.pre_audit - 1));
    setScoreFormats(row, colIndex.pre_audit);
    setScoreFormats(row, colIndex.courant);
  });

  // exporte le fichier modifié
  return workbook.xlsx.writeBuffer();
};

/** applique le formatage numérique aux colonnes points/scores à partir de l'index (base-1) donné */
const setScoreFormats = (row: Row, colIndex: number) => {
  setCellNumFormat(row.getCell(colIndex));
  setCellNumFormat(row.getCell(colIndex + 1));
  setCellNumFormat(row.getCell(colIndex + 2), FORMAT_PERCENT);
  setCellNumFormat(row.getCell(colIndex + 3));
  setCellNumFormat(row.getCell(colIndex + 4), FORMAT_PERCENT);
  row.getCell(colIndex + 5).style.alignment = ALIGN_CENTER;
};

// détermine la couleur de fond d'une ligne en fonction de la profondeur dans l'arbo
const getRowColor = (action?: TActionReferentiel) => {
  if (action) {
    const { depth, identifiant } = action;
    if (depth === 3) return BG_COLOR3;

    const axe = parseInt(identifiant.split('.')[0]);
    const colors = BG_COLORS[axe];
    if (colors && depth <= colors.length) return colors[depth - 1];
  }
};

// génère un index des colonnes (base 1)
const getColIndex = (colOffset: number) => {
  const scoreColsCount = SCORE_HEADER_LABELS.length;
  const pre_audit = 5 + colOffset;
  const courant = pre_audit + scoreColsCount;
  const commentaires = courant + scoreColsCount;
  return {
    arbo: 1,
    intitule: 2,
    phase: colOffset === 0 ? 3 : undefined,
    points_max_referentiel: 4 + colOffset,
    pre_audit,
    courant,
    commentaires,
    docs: commentaires + 1,
  };
};

const getColumnLabels = (referentiel: Enums<'referentiel'>) =>
  referentiel === 'cae' ? COLUMN_LABELS : COLUMN_LABELS.toSpliced(2, 1);

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
    formatPreuves(preuves) || '',
  ];

  // insère la colonne "phase" si nécessaire
  if (referentiel === 'cae') {
    values.splice(2, 0, capitalize(action?.phase));
  }

  return values;
};

const formatPreuves = (preuves?: TPreuve[]) =>
  preuves
    ?.map((p) => p?.lien?.url || p?.fichier?.filename || null)
    .filter((s) => !!s)
    .join('\n');
