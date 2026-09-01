import {
  DocumentAttendu,
  DocumentReglementaire,
  PreuveComplementaire,
} from './types';

export const preuveReglementaireNonRenseignee: DocumentReglementaire = {
  preuveType: 'reglementaire',
  id: 0,
  collectiviteId: 1,
  fichier: null,
  lien: null,
  commentaire: null,
  modifiedAt: null,
  modifiedBy: null,
  modifiedByNom: 'Équipe territoires en transitions',
  action: {
    actionId: 'eci_1.1.2',
    identifiant: '1.1.2',
  },
  preuveReglementaire: {
    id: 'pcaet_deliberation',
    nom: "Délibération d'engagement dans la Convention des Maires",
    description:
      'PCAET avec EES et résumé non technique ; éventuel bilan intermédiaire Preuve identique à la 1.1.1.3',
  },
};

export const preuveReglementaireLien: DocumentReglementaire = {
  preuveType: 'reglementaire',
  id: 1,
  collectiviteId: 1,
  fichier: null,
  lien: {
    url: 'http://yolo.dodo',
    titre: 'dodo',
  },
  commentaire: '',
  modifiedAt: '2022-09-06T16:20:24.690648+00:00',
  modifiedBy: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  modifiedByNom: 'Yolo Dodo',
  action: {
    actionId: 'eci_1.1.3',
    identifiant: '1.1.3',
  },
  preuveReglementaire: {
    id: 'agenda',
    nom: 'Agenda 21 / Agenda 2030',
    description:
      'PCAET avec EES et résumé non technique ; éventuel bilan intermédiaire Preuve identique à la 1.1.1.3',
  },
};

export const preuveReglementaireLienSansDescription: DocumentReglementaire = {
  preuveType: 'reglementaire',
  id: 12,
  collectiviteId: 1,
  fichier: null,
  lien: {
    url: 'http://yili.didi',
    titre: 'didi',
  },
  commentaire: 'commentaire',
  modifiedAt: '2022-09-06T16:20:24.690648+00:00',
  modifiedBy: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  modifiedByNom: 'Yili Didi',
  action: {
    actionId: 'eci_1.1.4',
    identifiant: '1.1.4',
  },
  preuveReglementaire: {
    id: 'etude_vulnerabilite',
    nom: 'Etude de vulnérabilité au changement climatique',
    description: '',
  },
};

export const preuveReglementaireFichier: DocumentReglementaire = {
  preuveType: 'reglementaire',
  id: 2,
  collectiviteId: 1,
  fichier: {
    hash: 'c9df071601f3f72b5430a55cd7ea584be5c2a36bb4226b621c4dca50088ef8b9',
    filename: 'preuve_input.txt',
    filesize: 34,
    bucketId: '9d4ccd86-268b-4292-aeda-18bfbe6496df',
    confidentiel: false,
  },
  lien: null,
  commentaire: 'commentaire preuve fichier',
  modifiedAt: '2022-09-06T16:43:41.423515+00:00',
  modifiedBy: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  modifiedByNom: 'Yolo Dodo',
  action: {
    actionId: 'eci_1.1.3',
    identifiant: '1.1.3',
  },
  preuveReglementaire: {
    id: 'etude_vulnerabilite',
    nom: 'Etude de vulnérabilité au changement climatique',
    description:
      'PCAET avec EES et résumé non technique ; éventuel bilan intermédiaire Preuve identique à la 1.1.1.3',
  },
};

const toAttendu = (
  documents: [DocumentReglementaire, ...DocumentReglementaire[]]
): DocumentAttendu => ({
  action: documents[0].action,
  preuveReglementaire: documents[0].preuveReglementaire,
  documents: documents.filter(({ fichier, lien }) => fichier || lien),
});

export const attenduNonRenseigne = toAttendu([
  preuveReglementaireNonRenseignee,
]);
export const attenduFichier = toAttendu([preuveReglementaireFichier]);
export const attenduLien = toAttendu([preuveReglementaireLien]);
export const attenduSansDescription = toAttendu([
  preuveReglementaireLienSansDescription,
]);
export const attenduPlusieursDocuments = toAttendu([
  preuveReglementaireFichier,
  { ...preuveReglementaireLien, id: 13 },
]);

export const preuveComplementaireLien: PreuveComplementaire = {
  preuveType: 'complementaire',
  id: 3,
  collectiviteId: 1,
  fichier: null,
  lien: {
    url: 'http://yolo.dodo',
    titre: 'dodo',
  },
  commentaire: '',
  modifiedAt: '2022-09-06T16:46:39.744518+00:00',
  modifiedBy: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  modifiedByNom: 'Yolo Dodo',
  action: {
    actionId: 'eci_1.1.3',
    identifiant: '1.1.3',
  },
};

export const preuveComplementaireFichier: PreuveComplementaire = {
  preuveType: 'complementaire',
  id: 4,
  collectiviteId: 1,
  fichier: {
    hash: 'c9df071601f3f72b5430a55cd7ea584be5c2a36bb4226b621c4dca50088ef8b9',
    filename: 'preuve_input.txt',
    filesize: 34,
    bucketId: '9d4ccd86-268b-4292-aeda-18bfbe6496df',
    confidentiel: false,
  },
  lien: null,
  commentaire: 'lala',
  modifiedAt: '2022-09-06T16:46:31.355212+00:00',
  modifiedBy: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  modifiedByNom: 'Yolo Dodo',
  action: {
    actionId: 'eci_1.1.3',
    identifiant: '1.1.3',
  },
};
