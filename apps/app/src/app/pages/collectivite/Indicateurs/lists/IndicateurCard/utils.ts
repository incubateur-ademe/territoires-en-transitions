import { IndicateurViewParamOption } from '@/app/app/paths';

/**
 * Retourne le groupe auquel appartient l'indicateur.
 * Si l'id est undefined, on assume que c'est un indicateur personnalisé.
 */
export const getIndicateurGroup = (
  indicateur_id?: string | null
): IndicateurViewParamOption => {
  if (typeof indicateur_id === 'string') {
    return indicateur_id.split('_')[0] as IndicateurViewParamOption;
  } else {
    return 'perso';
  }
};
