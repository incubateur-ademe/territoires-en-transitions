import {ActionAvancement} from 'generated/dataLayer/action_statut_read';

export const actionAvancementColors: Record<
  ActionAvancement | 'non_concerne',
  string
> = {
  fait: '#04C200',
  programme: '#FDE406',
  pas_fait: '#FD0606',
  non_renseigne: '#565656',
  non_concerne: '#d3d3d3',
};
