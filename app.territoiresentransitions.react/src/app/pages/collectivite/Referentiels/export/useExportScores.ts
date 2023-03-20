import {Workbook, Worksheet} from 'exceljs';
import {format} from 'date-fns';
import {saveBlob} from 'ui/shared/preuves/Bibliotheque/saveBlob';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {ActionReferentiel} from '../../ReferentielTable/useReferentiel';
import {Config} from './config';
import {
  MIME_XLSX,
  getActionIdentifiant,
  setNumValue,
  FORMAT_PERCENT,
  formatActionStatut,
} from 'utils/exportXLSX';
import {useExportData} from './useExportData';
import {Database} from 'types/database.types';
import {TCollectiviteScore} from './useCollectiviteScores';

export const useExportScores = (
  referentiel: string | null,
  collectivite: CurrentCollectivite | null
) => {
  const {loadTemplate, template, data, isLoading} = useExportData(
    referentiel,
    collectivite
  );

  const exportScores = () => {
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

  return {exportScores, isLoading};
};

// insère les données dans le modèle et sauvegarde le fichier xls résultant
const updateAndSaveXLS = async (
  referentiel: string,
  template: ArrayBuffer,
  data: {
    config: Config;
    collectivite: CurrentCollectivite;
    actionsByIdentifiant: Record<string, ActionReferentiel>;
    scoresByActionId: Record<string, TCollectiviteScore>;
    commentairesByActionId: Record<
      string,
      Database['public']['Tables']['action_commentaire']['Row']
    >;
  }
) => {
  const {
    config,
    collectivite,
    actionsByIdentifiant,
    scoresByActionId,
    commentairesByActionId,
  } = data;

  const {first_data_row, data_cols, info_cells} = config;

  // ouvre le classeur et sélectionne la première feuille de calcul
  const workbook = new Workbook();
  await workbook.xlsx.load(template);
  const worksheet = workbook.worksheets[0];

  // date d'export
  const exportedAt = new Date();

  // le nom du fichier cible
  const filename = `Export_${referentiel.toUpperCase()}_${
    collectivite.nom
  }_${format(exportedAt, 'yyyy-MM-dd')}.xlsx`;

  // remplace les valeurs dans le cartouche d'en-tête
  worksheet.getCell(info_cells.collectivite).value = collectivite.nom;
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

        // scores courant
        setScoreIntoRow(worksheet, data_cols, row, score, action);

        // commentaire de la collectivité
        const commentaire =
          commentairesByActionId[action.action_id]?.commentaire;
        const cell = worksheet.getCell(data_cols.commentaire + row);
        cell.value = commentaire;
        cell.alignment = {horizontal: 'left', wrapText: true};
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

// écrit les données de score d'une ligne dans la feuille de calcul
const setScoreIntoRow = (
  worksheet: Worksheet,
  data_cols: Config['data_cols'],
  row: number,
  score: TCollectiviteScore,
  action?: ActionReferentiel
) => {
  // points max réf.
  setNumValue(
    worksheet.getCell(data_cols.points_max_referentiel + row),
    score.points_max_referentiel
  );

  // score avant audit
  setNumValue(
    worksheet.getCell(data_cols.points_max_personnalises + row),
    score.points_max_personnalises
  );
  setNumValue(
    worksheet.getCell(data_cols.points_realises + row),
    score.points_realises
  );
  setNumValue(
    worksheet.getCell(data_cols.score_realise + row),
    score.score_realise,
    FORMAT_PERCENT
  );
  setNumValue(
    worksheet.getCell(data_cols.points_programmes + row),
    score.points_programmes
  );
  setNumValue(
    worksheet.getCell(data_cols.score_programme + row),
    score.score_programme,
    FORMAT_PERCENT
  );
  if (action && !action.have_children) {
    worksheet.getCell(data_cols.statut + row).value = formatActionStatut(score);
  }
};
