import {DcpRead} from 'generated/dataLayer/dcp_read';
import {Referentiel} from 'types/litterals';

export enum Fonction {
  referent = 'Référent·e',
  conseiller = 'Conseiller·e',
  technique = 'Équipe technique',
  politique = 'Équipe politique',
  partenaire = 'Partenaire',
}

export enum Acces {
  admin = 'Admin',
  edition = 'Édition',
  lecture = 'Lecture',
}

export interface User extends DcpRead {
  tel: string;
  fonction: Fonction;
  champ_intervention: Referentiel[];
  details_fonction: string;
  acces: Acces;
}

const userBase = {
  created_at: '',
  deleted: false,
  limited: false,
  modified_at: '',
};

export const fakeAdmin: User = {
  ...userBase,
  user_id: '1',
  nom: 'Yolo',
  prenom: 'Dodo',
  email: 'yolo@dodo.com',
  tel: '06 46 82 45 85',
  fonction: Fonction.referent,
  champ_intervention: ['cae'],
  details_fonction: 'Cheffe de projet PCAET',
  acces: Acces.admin,
};

export const fakeEditeur: User = {
  ...userBase,
  user_id: '2',
  nom: 'Yala',
  prenom: 'Dada',
  email: 'yala@dada.com',
  tel: '06 65 87 52 49',
  fonction: Fonction.technique,
  champ_intervention: ['cae', 'eci'],
  details_fonction:
    "Vice-Président à l'aménagement durable du territoire de la CC du Pays de Château-Gontier, adjoint au maire en charge du dVice-Président à l'aménagement durable du territoire de la CC du Pays de Château-Gontier",
  acces: Acces.edition,
};

export const fakeLecteur: User = {
  ...userBase,
  user_id: '3',
  nom: 'John',
  prenom: 'Doe',
  email: 'john@doe.com',
  tel: '06 75 51 24 57',
  fonction: Fonction.politique,
  champ_intervention: ['cae'],
  details_fonction:
    'Consultant assistance à maîtrise d’ouvrage - Bureau d’études Green Planet',
  acces: Acces.lecture,
};

export const fakeUsers: User[] = [fakeAdmin, fakeEditeur, fakeLecteur];
