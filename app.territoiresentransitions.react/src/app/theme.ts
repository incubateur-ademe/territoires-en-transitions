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
