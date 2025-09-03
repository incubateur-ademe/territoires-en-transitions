import { INDICATEURS_TRAJECTOIRE } from '@/app/indicateurs/trajectoires/trajectoire-constants';

export const DonneesGES = {
  indicateur: INDICATEURS_TRAJECTOIRE[0],
  sources: [
    { id: 'citepa', nom: 'CITEPA' },
    { id: 'rare', nom: 'RARE-OREC' },
    { id: 'collectivite', nom: 'Données de la collectivité' },
  ],
  valeursSecteurs: [
    {
      identifiant: 'cae_1.c',
      valeurs: [
        { source: 'citepa', valeur: 344.4 },
        { source: 'rare', valeur: 344.4 },
        { source: 'collectivite', valeur: 344.4 },
      ],
    },
    {
      identifiant: 'cae_1.d',
      valeurs: [
        { source: 'citepa', valeur: 112 },
        { source: 'rare', valeur: 316.1 },
        { source: 'collectivite', valeur: 316.1 },
      ],
    },
    {
      identifiant: 'cae_1.e',
      valeurs: [
        { source: 'citepa', valeur: 600.8 },
        { source: 'rare', valeur: 600.8 },
      ],
    },
    {
      identifiant: 'cae_1.f',
      valeurs: [],
    },
    {
      identifiant: 'cae_1.g',
      valeurs: [
        { source: 'citepa', valeur: 6.6 },
        { source: 'rare', valeur: 6.6 },
        { source: 'collectivite', valeur: 6.6 },
      ],
    },
    {
      identifiant: 'cae_1.h',
      valeurs: [
        { source: 'citepa', valeur: 0.46 },
        { source: 'rare', valeur: 0.46 },
        { source: 'collectivite', valeur: 0.46 },
      ],
    },
    {
      identifiant: 'cae_1.i',
      valeurs: [
        { source: 'citepa', valeur: 295.1 },
        { source: 'rare', valeur: 295.1 },
        { source: 'collectivite', valeur: 295.1 },
      ],
    },
    {
      identifiant: 'cae_1.j',
      valeurs: [
        { source: 'citepa', valeur: 19.1 },
        { source: 'rare', valeur: 19.1 },
        { source: 'collectivite', valeur: 19.1 },
      ],
    },
  ],
};
