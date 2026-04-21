import { HistoriqueReponseItem } from '../types';

export const fakeReponseChoix: HistoriqueReponseItem = {
  type: 'reponse',
  collectiviteId: 1,
  modifiedById: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  modifiedByNom: 'Yolo Dodo',
  previousModifiedById: null,
  modifiedAt: '2022-08-18T13:47:30.205174+00:00',
  previousModifiedAt: null,
  actionIds: null,
  questionId: 'voirie_1',
  questionType: 'choix',
  questionFormulation: 'La collectivité a-t-elle la compétence voirie ?',
  thematiqueId: 'mobilite',
  thematiqueNom: 'Mobilité',
  reponse: "Oui sur l'ensemble du territoire",
  previousReponse: null,
  justification: null,
};

export const fakeReponseChoix2: HistoriqueReponseItem = {
  ...fakeReponseChoix,
  previousReponse: "Oui sur l'ensemble du territoire",
  reponse:
    "Oui uniquement sur les trottoirs, parkings ou zones d'activités et industrielles",
};

export const fakeReponseBinaire: HistoriqueReponseItem = {
  type: 'reponse',
  collectiviteId: 1,
  modifiedById: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  modifiedByNom: 'Yolo Dodo',
  previousModifiedById: null,
  modifiedAt: '2022-08-18T13:47:14.396201+00:00',
  previousModifiedAt: null,
  actionIds: null,
  questionId: 'dechets_3',
  questionType: 'binaire',
  questionFormulation:
    'La collectivité est-elle chargée de la réalisation d\'un "Programme local de prévention des déchets ménagers et assimilés" (PLPDMA) du fait de sa compétence collecte et/ou par délégation d\'une autre collectivité ?',
  thematiqueId: 'dechets',
  thematiqueNom: 'Déchets',
  reponse: false,
  previousReponse: null,
  justification: null,
};

export const fakeReponseBinaire2: HistoriqueReponseItem = {
  ...fakeReponseBinaire,
  previousReponse: false,
  reponse: true,
};

export const fakeReponseProportion: HistoriqueReponseItem = {
  type: 'reponse',
  collectiviteId: 1,
  modifiedById: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  modifiedByNom: 'Yolo Dodo',
  previousModifiedById: null,
  modifiedAt: '2022-08-18T15:10:37.202555+00:00',
  previousModifiedAt: null,
  actionIds: null,
  questionId: 'dev_eco_2',
  questionType: 'proportion',
  questionFormulation:
    'Quelle est la part de la collectivité dans la structure compétente en matière de développement économique ?',
  thematiqueId: 'developpement_economique',
  thematiqueNom: 'Développement économique',
  reponse: 0.25,
  previousReponse: null,
  justification: null,
};

export const fakeReponseProportion2: HistoriqueReponseItem = {
  ...fakeReponseProportion,
  previousReponse: 0.25,
  reponse: 0.5,
};
