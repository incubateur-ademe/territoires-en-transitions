import {Membre} from 'app/pages/collectivite/Users/types';

export const fakeAdmin: Membre = {
  user_id: '1',
  nom: 'Yolo',
  prenom: 'Dodo',
  email: 'yolo@dodo.com',
  telephone: '06 46 82 45 85',
  fonction: 'referent',
  champ_intervention: ['cae'],
  details_fonction: 'Cheffe de projet PCAET',
  niveau_acces: 'admin',
};

export const fakeEditeur: Membre = {
  user_id: '2',
  nom: 'Yala',
  prenom: 'Dada',
  email: 'yala@dada.com',
  telephone: '06 65 87 52 49',
  fonction: 'technique',
  champ_intervention: ['cae', 'eci'],
  details_fonction:
    "Vice-Président à l'aménagement durable du territoire de la CC du Pays de Château-Gontier, adjoint au maire en charge du dVice-Président à l'aménagement durable du territoire de la CC du Pays de Château-Gontier",
  niveau_acces: 'edition',
};

export const fakeLecteur: Membre = {
  user_id: '3',
  nom: 'John',
  prenom: 'Doe',
  email: 'john@doe.com',
  telephone: '06 75 51 24 57',
  fonction: 'politique',
  champ_intervention: ['cae'],
  details_fonction:
    'Consultant assistance à maîtrise d’ouvrage - Bureau d’études Green Planet',
  niveau_acces: 'lecture',
};

const fakeInvite: Membre = {
  user_id: null,
  email: 'invite@dodo.com',
  niveau_acces: 'lecture',
};

export const fakeMembres: Membre[] = [
  fakeAdmin,
  fakeEditeur,
  fakeLecteur,
  fakeInvite,
];
