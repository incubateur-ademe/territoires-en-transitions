import { Enums } from './typeUtils.ts';

/** Transforme un statut d'avancemement en libellé */
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

const avancementToLabel: Record<Enums<'avancement'> | 'non_concerne', string> =
  {
    non_renseigne: 'Non renseigné',
    fait: 'Fait',
    pas_fait: 'Pas fait',
    detaille: 'Détaillé',
    programme: 'Programmé',
    non_concerne: 'Non concerné',
  };
