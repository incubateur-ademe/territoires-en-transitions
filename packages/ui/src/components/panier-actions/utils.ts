export type Complexite = 'simple' | 'intermédaire' | 'élevée';

export type State = 'success' | 'warning' | 'error';

export const valeurToBadge: Record<number, {nom: Complexite; style: State}> = {
  1: {nom: 'simple', style: 'success'},
  2: {nom: 'intermédaire', style: 'warning'},
  3: {nom: 'élevée', style: 'error'},
};
