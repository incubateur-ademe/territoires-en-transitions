export const HELPDESK_URL =
  'https://aide.territoiresentransitions.fr/fr/article/la-trajectoire-snbc-territorialisee-bientot-disponible-sur-territoires-en-transitions-1g46muy/#3-comment-sera-t-elle-mise-a-votre-disposition';

export const INDICATEURS_TRAJECTOIRE = [
  {
    id: 'emissions_ges',
    nom: 'Émissions GES',
    titre: 'Comparaison des trajectoires d’émissions de GES',
    unite: 'teq CO2',
    identifiant: 'cae_1.a',
    secteurs: [
      {
        nom: 'Résidentiel',
        identifiant: 'cae_1.c',
      },
      {
        nom: 'Tertiaire',
        identifiant: 'cae_1.d',
      },
      {
        nom: 'Industrie',
        identifiant: 'cae_1.i',
      },
      {nom: 'Agriculture', identifiant: 'cae_1.g'},
      {nom: 'Transports', identifiant: 'cae_1.k'},
      //      {nom: 'Transport routier', identifiant: 'cae_1.e'},
      //      {nom: 'Autres transports', identifiant: 'cae_1.f'},
      {nom: 'Déchets', identifiant: 'cae_1.h'},
      {nom: 'Branche énergie', identifiant: 'cae_1.j'},
      // UTCATF (Utilisation des terres, changement d'affectation des terres et foresterie)
      // CSC (Captage et stockage géologique de CO2) ?
    ],
  },
  {
    id: 'consommations_finales',
    nom: "Consommation d'énergie",
    titre: "Comparaison des trajectoires de consommation d'énergie",
    unite: 'GWh',
    identifiant: 'cae_2.a',
    secteurs: [
      {nom: 'Résidentiel', identifiant: 'cae_2.e'},
      {nom: 'Tertiaire', identifiant: 'cae_2.f'},
      {nom: 'Industrie', identifiant: 'cae_2.k'},
      {nom: 'Agriculture', identifiant: 'cae_2.i'},
      //{nom: 'Transport', identifiant: 'cae_2.?'},
      {nom: 'Transport routier', identifiant: 'cae_2.g'},
      {nom: 'Autres Transports', identifiant: 'cae_2.h'},
      {nom: 'Déchets', identifiant: 'cae_2.j'},
      //{nom: 'Branche énergie', identifiant: ['manquante à date']},
    ],
  },
] as const;
