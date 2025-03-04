/**
 * Export des indicateurs au format XLSX
 */
import {
  BlobReader,
  BlobWriter,
  ZipWriter,
} from 'https://deno.land/x/zipjs@v2.7.29/index.js';
import Excel from 'https://esm.sh/exceljs@4.3.0';
import { convert } from 'https://esm.sh/html-to-text@9.0.5';
import * as Utils from '../_shared/exportUtils.ts';
import { TSupabaseClient } from '../_shared/getSupabaseClient.ts';
import { fetchData, TExportData } from './fetchData.ts';
import { TExportArgs, TIndicateurId } from './types.ts';

/**
 * Génère et renvoi sous forme de blob, un fichier xlsx par indicateur à
 * exporter. Si il y a un seul indicateur le fichier xlsx correspondant est
 * renvoyé, sinon tous les fichiers xlsx sont rassemblés dans un zip.
 */
export const exportXLSX = async (
  supabaseClient: TSupabaseClient,
  args: TExportArgs
) => {
  const { indicateur_ids } = args;
  if (!indicateur_ids?.length) {
    throw new Error('Argument non valide');
  }

  // charge les données
  const data = await fetchData(supabaseClient, args);

  /** un seul indicateur à exporter */
  if (indicateur_ids.length === 1) {
    const id = indicateur_ids[0];
    const { buffer } = await genIndicateurWorkbook(id, data);
    return buffer;
  }

  /** sinon les exports de chaque indicateur sont rassemblés dans un zip */
  const zipWriter = new ZipWriter(new BlobWriter('application/zip'), {
    bufferedWrite: true,
    level: 0, // pas de compression car les fichiers xlsx sont eux-mêmes des zip
  });
  await Promise.all(
    indicateur_ids.map((id) => {
      // génère un workbook par indicateur
      return genIndicateurWorkbook(id, data).then(({ buffer, filename }) => {
        // et l'ajoute au zip
        if (filename) {
          return zipWriter.add(
            // enlève les "/" qui créent des sous-dossiers non voulus dans le zip
            filename.replaceAll('/', '-'),
            new BlobReader(new Blob([buffer]))
          );
        }
      });
    })
  );

  // finalise le zip et renvoi le blob
  return zipWriter.close();
};

/** Clée le classeur contenant l'export d'un indicateur */
const genIndicateurWorkbook = async (id: TIndicateurId, data: TExportData) => {
  const { definitions, definitionsPersos, valeurs, valeursPersos } = data;

  // crée le classeur
  const workbook = new Excel.Workbook();

  // date d'export
  const exportedAt = Utils.formatDate(new Date(), 'yyyy-MM-dd');

  // ajoute l'indicateur au classeur et génère le nom du fichier
  let filename;
  if (typeof id === 'string') {
    const def = definitions.find((d) => d.id === id);
    if (def) {
      addIndicateurToWorkbook(workbook, def, valeurs);
      filename = `${def.id} - ${def.nom} - ${exportedAt}.xlsx`;
    }
  } else {
    const def = definitionsPersos.find((d) => d.id === id);
    if (def) {
      filename = `${def.nom} - ${exportedAt}.xlsx`;
      addIndicateurPersoToWorkbook(workbook, def, valeursPersos);
    }
  }

  // exporte le fichier modifié
  return {
    buffer: await workbook.xlsx.writeBuffer(),
    filename,
  };
};

/** Ajoute les feuilles de définition et des données d'un indicateur à un classeur */
const addIndicateurToWorkbook = (
  workbook: Excel.Workbook,
  definition: TExportData['definitions'][0],
  valeurs: TExportData['valeurs']
) => {
  const { titre_long, description, thematiqueNoms, enfants, sans_valeur } =
    definition;

  // ajoute une feuille avec la définition
  const wsDef = addDefinitionWorksheet(workbook, titre_long, description);

  // complète la feuille avec les thématiques
  const definitionRows = [['Thématiques', thematiqueNoms?.join(',')]];
  // et si nécessaire la correspondance id => libellés des sous-indicateurs
  if (enfants?.length) {
    definitionRows.push([
      'Sous-indicateurs',
      enfants.map(({ id, nom }) => `${id} : ${nom}`).join('\n'),
    ]);
  }
  wsDef.addRows(definitionRows);

  // ajoute la feuille des données principales
  if (!sans_valeur) {
    const wsData = workbook.addWorksheet('Données');
    addIndicateurDataToWorksheet(wsData, definition, valeurs);
  }

  // puis si nécessaire une feuille de données pour chaque sous-indicateur
  enfants?.forEach((def) => {
    const wsData = workbook.addWorksheet(def.id);
    addIndicateurDataToWorksheet(wsData, def, valeurs);
  });
};

/** Ajoute les feuilles de définition et des données d'un indicateur perso. à un classeur */
const addIndicateurPersoToWorkbook = (
  workbook: Excel.Workbook,
  definition: TExportData['definitionsPersos'][0],
  valeurs: TExportData['valeurs']
) => {
  const { nom, description, thematiques } = definition;

  // ajoute une feuille avec la définition
  const wsDef = addDefinitionWorksheet(workbook, nom || '', description || '');

  // complète la feuille avec les thématiques
  const definitionRows = [
    ['Thématiques', thematiques?.map((t) => t.nom)?.join(',')],
  ];
  wsDef.addRows(definitionRows);

  // ajoute la feuille de données
  const wsData = workbook.addWorksheet('Données');
  addIndicateurDataToWorksheet(wsData, definition, valeurs);
};

/** Ajoute la feuille de définition d'un indicateur à un classeur */
const addDefinitionWorksheet = (
  workbook: Excel.Workbook,
  nom: string,
  description: string
) => {
  const wsDef = workbook.addWorksheet('Définition');
  wsDef.columns = [{ width: 15 }, { width: 80 }];
  wsDef.getColumn(1).font = Utils.BOLD;
  wsDef.getColumn(1).alignment = { horizontal: 'left', vertical: 'middle' };
  wsDef.getColumn(2).alignment = Utils.ALIGN_LEFT_WRAP;
  wsDef.addRows([
    ['Nom', nom],
    ['Description', convert(description, { wordwrap: false })],
  ]);
  return wsDef;
};

/** Ajoute la feuille des données d'un indicateur à un classeur */
const addIndicateurDataToWorksheet = (
  wsData: Excel.Worksheet,
  definition: { id: number | string; unite: string },
  valeurs: TExportData['valeurs']
) => {
  const { id, unite } = definition;
  const data = valeurs?.[id];

  // crée les colonnes
  wsData.columns = [{ width: 12 }, { width: 30 }, { width: 30 }];

  // ajoute les lignes
  const uniteFmt = unite ? ` (${unite})` : '';
  wsData.addRows([
    ['Année', `Résultat${uniteFmt}`, `Objectif${uniteFmt}`],
    ...(data?.map((v) => [v.annee, v.resultat, v.objectif]) || []),
  ]);

  // applique les styles
  wsData.getRow(1).font = Utils.BOLD;
  wsData.getRow(1).alignment = Utils.ALIGN_CENTER_WRAP;
  if (data?.length) {
    for (let r = 2; r <= 2 + data.length; r++) {
      Utils.setCellNumFormat(wsData.getRow(r).getCell(2));
      Utils.setCellNumFormat(wsData.getRow(r).getCell(3));
    }
  }

  return wsData;
};
