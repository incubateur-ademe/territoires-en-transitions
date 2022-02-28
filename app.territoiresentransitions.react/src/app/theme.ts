import {ActionAvancement} from 'generated/dataLayer/action_statut_read';

export const actionAvancementColors: Record<
  ActionAvancement | 'non_concerne',
  string
> = {
  fait: '#0063CB',
  programme: '#00A95F',
  pas_fait: '#FF6384',
  non_renseigne: '#565656',
  non_concerne: '#D3D3D3',
  detaille: '#ff7f00',
};
