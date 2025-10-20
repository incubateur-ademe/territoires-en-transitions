import { CollectiviteMembre } from '@/app/referentiels/tableau-de-bord/referents/useMembres';

export const fakeAdmin: CollectiviteMembre = {
  userId: '1',
  nom: 'Yolo',
  prenom: 'Dodo',
  email: 'yolo@dodo.com',
  telephone: '06 46 82 45 85',
  fonction: 'conseiller',
  champIntervention: ['cae'],
  detailsFonction: 'Cheffe de projet PCAET',
  niveauAcces: 'admin',
  invitationId: '',
  estReferent: false,
};

export const fakeEditeur: CollectiviteMembre = {
  userId: '2',
  nom: 'Yala',
  prenom: 'Dada',
  email: 'yala@dada.com',
  telephone: '06 65 87 52 49',
  fonction: 'technique',
  champIntervention: ['cae', 'eci'],
  detailsFonction:
    "Vice-Président à l'aménagement durable du territoire de la CC du Pays de Château-Gontier, adjoint au maire en charge du dVice-Président à l'aménagement durable du territoire de la CC du Pays de Château-Gontier",
  niveauAcces: 'edition',
  invitationId: '',
  estReferent: false,
};

export const fakeLecteur: CollectiviteMembre = {
  userId: '3',
  nom: 'John',
  prenom: 'Doe',
  email: 'john@doe.com',
  telephone: '06 75 51 24 57',
  fonction: 'politique',
  champIntervention: ['cae'],
  detailsFonction:
    'Consultant assistance à maîtrise d’ouvrage - Bureau d’études Green Planet',
  niveauAcces: 'lecture',
  invitationId: '',
  estReferent: false,
};

const fakeInvite: CollectiviteMembre = {
  userId: '',
  nom: null,
  prenom: null,
  email: 'invite@dodo.com',
  telephone: null,
  fonction: null,
  champIntervention: null,
  detailsFonction: null,
  niveauAcces: 'lecture',
  invitationId: 'some-uuid',
  estReferent: false,
};

export const fakeMembres: CollectiviteMembre[] = [
  fakeAdmin,
  fakeEditeur,
  fakeLecteur,
  fakeInvite,
];
