import {FicheActionAvancement} from 'types';

export const progressStateColors = {
  nc: '#444',
  alert: '#DA0505',
  warning: '#F59E0B',
  ok: '#FCD34D',
  good: '#C0D72D',
  best: '#059669',
};

export const ficheActionAvancementColors: Record<
  FicheActionAvancement,
  string
> = {
  fait: '#059669',
  en_cours: '#C0D72D',
  pas_fait: '#DA0505',
  non_renseigne: '#444',
};
