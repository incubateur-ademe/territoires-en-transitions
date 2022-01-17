import {ActionAvancement} from 'generated/dataLayer/action_statut_read';

export const actionAvancementColors: Record<
  ActionAvancement | 'non_concerne',
  string
> = {
  fait: '#059669', //'rgb(5, 150, 105, 1)',
  programme: '#C0D72D', //,'rgb(192, 215,	45, 1)',
  pas_fait: '#FF6384', //'rgb(255, 99, 132, 1)', //'rgb(250, 94, 67, 1)',
  non_renseigne: '#565656', //'rgb(86, 86, 86, 1)',
  non_concerne: '#D3D3D3', //'rgb(211, 211, 211, 1)',
};
