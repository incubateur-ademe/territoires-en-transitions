/**
 * Utilitaires pour les exports XLSX
 */

import {Cell, Worksheet} from 'exceljs';
import {useQuery} from 'react-query';
import {avancementToLabel} from 'app/labels';
import {Database} from 'types/database.types';

export const MIME_XLSX =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// regex pour extraire les identifiants
const RE_IDENTIFIANT = /(\d+\.?)+/;

// extrait l'identifiant d'une ligne du tableau
export const getActionIdentifiant = (
  worksheet: Worksheet,
  row: number,
  col: string
) => {
  const value = worksheet.getCell(col + row).text;
  const matches = value.match(RE_IDENTIFIANT);
  return matches?.length ? matches[0] : null;
};

/** Fourni le modèle de fichier nécessaire à un export */
export const useExportTemplate = (
  /** préfixe du fichier template (par ex. "export_audit" pour charger `export_audit_<referentiel>.xlsx`) */
  filePrefix: string,
  referentiel: string | null
) =>
  useQuery(
    [filePrefix, referentiel],
    async () => {
      if (!referentiel) {
        return null;
      }
      const response = await fetch(
        `${process.env.PUBLIC_URL}/${filePrefix}_${referentiel}.xlsx`,
        {
          headers: {
            'Content-Type': MIME_XLSX,
            Accept: MIME_XLSX,
          },
        }
      );
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        return buffer;
      }
      return null;
    },
    {
      // on ne charge les données que lors d'un appel explicite à `refetch`
      enabled: false,
      // et on évite les rechargements automatiques
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

// fixe la valeur numérique d'une cellule
export const setNumValue = (
  cell: Cell,
  value: number | null,
  numFmt?: string
) => {
  cell.value = value;
  cell.style = {
    ...cell.style,
    alignment: {horizontal: 'center'},
    numFmt: getNumberFormat(value, numFmt),
  };
};

// génère le format utilisé pour les nombres
export const FORMAT_PERCENT = 'percent';
export const getNumberFormat = (value: number | null, numFmt?: string) => {
  const suffix = numFmt === FORMAT_PERCENT ? '%' : '';

  // pas de virgule si le nombre est entier (ou null => forcé à 0)
  if (value === null || Number.isInteger(value)) {
    return '0' + suffix;
  }
  if (numFmt === FORMAT_PERCENT) {
    // un seul chiffre après la virgule pour les pourcentages
    return '0.#' + suffix;
  }
  // deux chiffres après la virgule
  return '0.0#' + suffix;
};

// formate le statut d'avancmement d'une action
export const formatActionStatut = (score: {
  avancement: Database['public']['Enums']['avancement'] | null;
  concerne: boolean | null;
  desactive: boolean | null;
}) => {
  const {concerne, desactive, avancement} = score;
  if (concerne === false || desactive === true) {
    return 'Non concerné';
  }

  if (!avancement || !avancementToLabel[avancement]) {
    return avancementToLabel['non_renseigne'];
  }

  return avancementToLabel[avancement];
};
