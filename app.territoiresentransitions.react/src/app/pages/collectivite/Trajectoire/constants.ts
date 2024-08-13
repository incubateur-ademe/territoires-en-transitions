export const HELPDESK_URL =
  'https://aide.territoiresentransitions.fr/fr/article/la-trajectoire-snbc-territorialisee-bientot-disponible-sur-territoires-en-transitions-1g46muy/#3-comment-sera-t-elle-mise-a-votre-disposition';
export const INDICATEURS_TRAJECTOIRE = [
  {
    id: 'ges',
    nom: 'Émissions GES',
    secteurs: [
      {nom: 'Résidentiel', indicateurs: ['cae_1.c']},
      {nom: 'Tertiaire', indicateurs: ['cae_1.d']},
      {nom: 'Industrie', indicateurs: ['cae_1.i']},
      {nom: 'Agriculture', indicateurs: ['cae_1.g']},
      {nom: 'Transports', indicateurs: ['cae_1.e', 'cae_1.f']},
      // {nom: 'Transport routier', indicateurs: ['cae_1.e']},
      // {nom: 'Autres transports', indicateurs: ['cae_1.f']},
      {nom: 'Déchets', indicateurs: ['cae_1.h']},
      {nom: 'Branche énergie', indicateurs: ['cae_1.j']},
      // UTCATF (Utilisation des terres, changement d'affectation des terres et foresterie)
      // CSC (Captage et stockage géologique de CO2) ?
    ],
  },
  {
    id: 'energie',
    nom: "Consommation d'énergie",
    secteurs: [
      {nom: 'Résidentiel', indicateurs: ['cae_2.e']},
      {nom: 'Tertiaire', indicateurs: ['cae_2.f']},
      {nom: 'Industrie', indicateurs: ['cae_2.k']},
      {nom: 'Agriculture', indicateurs: ['cae_2.i']},
      {nom: 'Transport', indicateurs: ['cae_2.g', 'cae_2.h']},
      {nom: 'Déchets', indicateurs: ['cae_2.j']},
      //{nom: 'Branche énergie', indicateurs: ['manquante à date']},
    ],
  },
] as const;
