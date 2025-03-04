import Excel from 'https://esm.sh/exceljs@4.3.0';
import { Enums } from '../_shared/typeUtils.ts';

// regex pour extraire les identifiants
const RE_IDENTIFIANT = /(\d+\.?)+/;

// extrait l'identifiant d'une ligne du tableau
export const getActionIdentifiant = (
  worksheet: Excel.Worksheet,
  row: number,
  col: string
) => {
  const value = worksheet.getCell(col + row).text;
  const matches = value.match(RE_IDENTIFIANT);
  return matches?.length ? matches[0] : null;
};

// formate le statut d'avancmement d'une action
type TActionAvancement = Enums<'avancement'> | 'non_concerne';
const avancementToLabel: Record<TActionAvancement, string> = {
  non_renseigne: 'Non renseigné',
  fait: 'Fait',
  pas_fait: 'Pas fait',
  detaille: 'Détaillé',
  programme: 'Programmé',
  non_concerne: 'Non concerné',
};
export const formatActionStatut = (score: {
  avancement: Enums<'avancement'> | null;
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
