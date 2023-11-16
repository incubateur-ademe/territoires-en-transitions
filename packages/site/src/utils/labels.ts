export const secteurIdToLabel: Record<string, string> = {
  'cae_1.a': 'Total',
  'cae_1.d': 'Tertiaire',
  'cae_1.e': 'Routier',
  'cae_1.c': 'Résidentiel',
  'cae_1.i': 'Industrie hors énergie',
  'cae_1.j': 'Energie',
  'cae_1.h': 'Déchets',
  'cae_1.f': 'Autres Transports',
  'cae_1.g': 'Agriculture',
};

export const fluxToLabel: Record<string, string> = {
  activite: 'Activité',
  habitat: 'Habitat',
  mixte: 'Mixte',
  routiere: 'Routière',
  ferroviaire: 'Ferroviaire',
  inconnue: 'Inconnue',
};

export const natureCollectiviteToLabel: Record<string, string> = {
  commune: 'Commune',
  CC: 'Communauté de communes',
  CA: "Communauté d'agglomération",
  CU: 'Communauté urbaine',
  EPT: 'Etablissement Public Territorial',
  METRO: 'Métropole',
  PETR: "Pôle d'équilibre territorial rural",
  POLEM: 'Pôle métropolitain',
};

export const referentielToLabel: Record<string, string> = {
  cae: 'Climat Air Énergie',
  eci: 'Économie Circulaire',
};
