import {Cell, Workbook, Worksheet} from 'exceljs';
import {format} from 'date-fns';
import {saveBlob} from 'ui/shared/preuves/Bibliotheque/saveBlob';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {ActionReferentiel} from '../../ReferentielTable/useReferentiel';
import {Membre} from '../../Users/types';
import {TComparaisonScoreAudit, TScoreAudit} from '../types';
import {Config, MIME_XLSX, getActionIdentifiant} from './config';
import {useExportData} from './useExportData';
import {Database} from 'types/database.types';
import {avancementToLabel} from 'app/labels';

export const useExportAuditScores = (
  referentiel: string | null,
  collectivite: CurrentCollectivite | null
) => {
  const {loadTemplate, template, data, isLoading} = useExportData(
    referentiel,
    collectivite
  );

  const exportAuditScores = () => {
    // charge le modèle si nécessaire et insère les données
    if (data && referentiel) {
      if (template) {
        updateAndSaveXLS(referentiel, template, data);
      } else {
        loadTemplate().then(({data: fetchedTemplate}) => {
          if (fetchedTemplate) {
            updateAndSaveXLS(referentiel, fetchedTemplate, data);
          }
        });
      }
    }
  };

  return {exportAuditScores, isLoading};
};

const FORMAT_PERCENT = 'percent';

// insère les données dans le modèle et sauvegarde le fichier xls résultant
const updateAndSaveXLS = async (
  referentiel: string,
  template: ArrayBuffer,
  data: {
    config: Config;
    collectivite: CurrentCollectivite;
    actionsByIdentifiant: Record<string, ActionReferentiel>;
    scoresByActionId: Record<string, TComparaisonScoreAudit>;
    commentairesByActionId: Record<
      string,
      Database['public']['Tables']['action_commentaire']['Row']
    >;
    auditeurs: Membre[];
  }
) => {
  const {
    config,
    collectivite,
    actionsByIdentifiant,
    scoresByActionId,
    commentairesByActionId,
    auditeurs,
  } = data;

  const {first_data_row, data_cols, info_cells} = config;

  // ouvre le classeur et sélectionne la première feuille de calcul
  const workbook = new Workbook();
  await workbook.xlsx.load(template);
  const worksheet = workbook.worksheets[0];

  // date d'export
  const exportedAt = new Date();

  // le nom du fichier cible
  const filename = `Export_audit_${collectivite.nom}_${format(
    exportedAt,
    'yyyy-MM-dd'
  )}.xlsx`;

  // remplace les valeurs dans le cartouche d'en-tête
  worksheet.getCell(info_cells.collectivite).value = collectivite.nom;
  worksheet.getCell(info_cells.auditeurs).value = auditeurs
    .map(({prenom, nom}) => `${prenom} ${nom}`)
    .join(' / ');
  worksheet.getCell(info_cells.exportedAt).value = format(
    exportedAt,
    'dd/MM/yyyy'
  );

  // remplace les valeurs de la ligne "total"
  const total = scoresByActionId[referentiel];
  if (total) {
    setScoreIntoRow(worksheet, data_cols, config.total_row, total);
  }

  // remplace les valeurs de chaque ligne/action
  let row = first_data_row;
  let identifiant = getActionIdentifiant(worksheet, row, data_cols.identifiant);
  while (identifiant !== null) {
    const action = actionsByIdentifiant[identifiant];
    if (action) {
      const score = scoresByActionId[action.action_id];
      if (score) {
        // pour que la hauteur de chaque ligne soit ajustée à son contenu
        worksheet.getRow(row).height = undefined!;

        // info sur l'action
        worksheet.getCell(data_cols.identifiant + row).value = identifiant;
        worksheet.getCell(data_cols.nom + row).value = action.nom;
        if (data_cols.phase) {
          worksheet.getCell(data_cols.phase + row).value = action.phase;
        }

        // scores avant audit et courant
        setScoreIntoRow(worksheet, data_cols, row, score, action);

        // commentaire de la collectivité
        const commentaire =
          commentairesByActionId[action.action_id]?.commentaire;
        const cell = worksheet.getCell(data_cols.commentaire + row);
        cell.value = commentaire;
        cell.alignment = {horizontal: 'left'};
      }
    }

    // ligne suivante
    row += 1;
    identifiant = getActionIdentifiant(worksheet, row, data_cols.identifiant);
  }

  // sauvegarde le fichier modifié
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {type: MIME_XLSX});
  saveBlob(blob, filename);
};

// fixe la valeur numérique d'une cellule
const setNumValue = (cell: Cell, value: number | null, numFmt?: string) => {
  cell.value = value;
  cell.style = {
    ...cell.style,
    alignment: {horizontal: 'center'},
    numFmt: getNumberFormat(value, numFmt),
  };
};

// génère le format utilisé pour les nombres
const getNumberFormat = (value: number | null, numFmt?: string) => {
  const suffix = numFmt === FORMAT_PERCENT ? '%' : '';
  if (value === null || Number.isInteger(value)) {
    return '0' + suffix;
  }
  return '0.0#' + suffix;
};

// formate le statut d'avancmement d'une action
const formatStatut = (score: TScoreAudit) => {
  const {concerne, desactive, avancement} = score;
  if (concerne === false || desactive === true) {
    return 'Non concerné';
  }

  if (!avancement || !avancementToLabel[avancement]) {
    return avancementToLabel['non_renseigne'];
  }

  return avancementToLabel[avancement];
};

// écrit les données de score d'une ligne dans la feuille de calcul
const setScoreIntoRow = (
  worksheet: Worksheet,
  data_cols: Config['data_cols'],
  row: number,
  score: TComparaisonScoreAudit,
  action?: ActionReferentiel
) => {
  // score avant audit
  setNumValue(
    worksheet.getCell(data_cols.pre_audit.points_max_personnalises + row),
    score.pre_audit.points_max_personnalises
  );
  setNumValue(
    worksheet.getCell(data_cols.pre_audit.points_realises + row),
    score.pre_audit.points_realises
  );
  setNumValue(
    worksheet.getCell(data_cols.pre_audit.score_realise + row),
    score.pre_audit.score_realise,
    FORMAT_PERCENT
  );
  setNumValue(
    worksheet.getCell(data_cols.pre_audit.points_programmes + row),
    score.pre_audit.points_programmes
  );
  setNumValue(
    worksheet.getCell(data_cols.pre_audit.score_programme + row),
    score.pre_audit.score_programme,
    FORMAT_PERCENT
  );
  if (action && !action.have_children) {
    worksheet.getCell(data_cols.pre_audit.statut + row).value = formatStatut(
      score.pre_audit
    );
  }

  // score après audit
  setNumValue(
    worksheet.getCell(data_cols.courant.points_max_personnalises + row),
    score.courant.points_max_personnalises
  );
  setNumValue(
    worksheet.getCell(data_cols.courant.points_realises + row),
    score.courant.points_realises
  );
  setNumValue(
    worksheet.getCell(data_cols.courant.score_realise + row),
    score.courant.score_realise,
    FORMAT_PERCENT
  );
  setNumValue(
    worksheet.getCell(data_cols.courant.points_programmes + row),
    score.courant.points_programmes
  );
  setNumValue(
    worksheet.getCell(data_cols.courant.score_programme + row),
    score.courant.score_programme,
    FORMAT_PERCENT
  );
  if (action && !action.have_children) {
    worksheet.getCell(data_cols.courant.statut + row).value = formatStatut(
      score.courant
    );
  }
};
