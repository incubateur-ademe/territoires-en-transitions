import {ActionAvancement} from 'generated/dataLayer/action_statut_read';

export const actionAvancementColors: Record<
  ActionAvancement | 'non_concerne' | 'detaille',
  string
> = {
  fait: '#0063CB',
  programme: '#00A95F',
  pas_fait: '#CE0500',
  non_renseigne: '#565656',
  non_concerne: '#D3D3D3',
  detaille: '#E7A969',
};

// Couleurs statuts actions référentiels
export const actionAvancementColors_new: Record<
  ActionAvancement | 'non_concerne',
  string
> = {
  non_concerne: '#929292',
  non_renseigne: '#E5E5E5',
  pas_fait: '#F95C5E',
  programme: '#7AB1E8',
  detaille: '#000091',
  fait: '#34CB6A',
};
