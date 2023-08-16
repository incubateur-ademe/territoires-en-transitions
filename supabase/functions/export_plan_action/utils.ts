import { Cell, Worksheet } from 'https://esm.sh/exceljs@4.3.0';
import { format, isValid } from 'https://esm.sh/date-fns@2.30.0';
import { fr } from 'https://esm.sh/date-fns@2.30.0/locale';
import { Database } from '../_shared/database.types.ts';

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

// fixe la valeur numérique d'une cellule
export const setNumValue = (
  cell: Cell,
  value: number | null,
  numFmt?: string
) => {
  cell.value = value;
  cell.style = {
    ...cell.style,
    alignment: { horizontal: 'center' },
    numFmt: getNumberFormat(value, numFmt),
  };
};

// formate une date
export const formatDate = (
  strDate: string | Date | null,
  pattern = 'dd/MM/yyyy'
) => {
  if (!strDate) {
    return null;
  }
  const d = new Date(strDate);
  return isValid(d) ? format(d, pattern, { locale: fr }) : null;
};

// génère le format utilisé pour les nombres
export const FORMAT_PERCENT = 'percent';
export const getNumberFormat = (value: number | null, numFmt?: string) => {
  const suffix = numFmt === FORMAT_PERCENT ? '%' : '';

  // pas de virgule si le nombre est entier (ou null => forcé à 0)
  if (value === null || Number.isInteger(value)) {
    return `0${suffix}`;
  }
  if (numFmt === FORMAT_PERCENT) {
    // un seul chiffre après la virgule pour les pourcentages
    return `0.#${suffix}`;
  }
  // deux chiffres après la virgule
  return `0.0#${suffix}`;
};

// formate le statut d'avancmement d'une action
type TActionAvancement =
  | Database['public']['Enums']['avancement']
  | 'non_concerne';
const avancementToLabel: Record<TActionAvancement, string> = {
  non_renseigne: 'Non renseigné',
  fait: 'Fait',
  pas_fait: 'Pas fait',
  detaille: 'Détaillé',
  programme: 'Programmé',
  non_concerne: 'Non concerné',
};
export const formatActionStatut = (score: {
  avancement: Database['public']['Enums']['avancement'] | null;
  concerne: boolean | null;
  desactive: boolean | null;
}) => {
  const { concerne, desactive, avancement } = score;
  if (concerne === false || desactive === true) {
    return 'Non concerné';
  }

  if (!avancement || !avancementToLabel[avancement]) {
    return avancementToLabel.non_renseigne;
  }

  return avancementToLabel[avancement];
};

export const setEuroValue = (cell: Cell, value: number | undefined | null) => {
  cell.numFmt = '#,##0.00 [$€-1]';
  cell.value = value || null;
};

export const getAnnexesLabels = (
  annexes: TExportData['annexes'],
  ficheId: number
) =>
  annexes
    ?.filter((annexe) => annexe.fiche_id === ficheId)
    .map((annexe) => annexe?.lien?.url || annexe?.fichier?.filename || null)
    .filter((s) => !!s);
