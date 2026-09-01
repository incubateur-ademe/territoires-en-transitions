import {
  DocumentAttendu,
  DocumentReglementaire,
  PreuveComplementaire,
} from './types';

export const preuveReglementaireNonRenseignee: DocumentReglementaire = {
  preuve_type: 'reglementaire',
  id: 0,
  collectivite_id: 1,
  fichier: null,
  lien: null,
  commentaire: null,
  created_at: null,
  created_by: null,
  created_by_nom: 'Équipe territoires en transitions',
  action: {
    action_id: 'eci_1.1.2',
    identifiant: '1.1.2',
  },
  preuve_reglementaire: {
    id: 'pcaet_deliberation',
    nom: "Délibération d'engagement dans la Convention des Maires",
    description:
      'PCAET avec EES et résumé non technique ; éventuel bilan intermédiaire Preuve identique à la 1.1.1.3',
  },
  demande: null,
  audit: null,
  rapport: null,
};

export const preuveReglementaireLien: DocumentReglementaire = {
  preuve_type: 'reglementaire',
  id: 1,
  collectivite_id: 1,
  fichier: null,
  lien: {
    url: 'http://yolo.dodo',
    titre: 'dodo',
  },
  commentaire: '',
  created_at: '2022-09-06T16:20:24.690648+00:00',
  created_by: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  created_by_nom: 'Yolo Dodo',
  action: {
    action_id: 'eci_1.1.3',
    identifiant: '1.1.3',
  },
  preuve_reglementaire: {
    id: 'agenda',
    nom: 'Agenda 21 / Agenda 2030',
    description:
      'PCAET avec EES et résumé non technique ; éventuel bilan intermédiaire Preuve identique à la 1.1.1.3',
  },
  demande: null,
  audit: null,
  rapport: null,
};

export const preuveReglementaireLienSansDescription: DocumentReglementaire = {
  preuve_type: 'reglementaire',
  id: 12,
  collectivite_id: 1,
  fichier: null,
  lien: {
    url: 'http://yili.didi',
    titre: 'didi',
  },
  commentaire: 'commentaire',
  created_at: '2022-09-06T16:20:24.690648+00:00',
  created_by: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  created_by_nom: 'Yili Didi',
  action: {
    action_id: 'eci_1.1.4',
    identifiant: '1.1.4',
  },
  preuve_reglementaire: {
    id: 'etude_vulnerabilite',
    nom: 'Etude de vulnérabilité au changement climatique',
    description: '',
  },
  demande: null,
  audit: null,
  rapport: null,
};

export const preuveReglementaireFichier: DocumentReglementaire = {
  preuve_type: 'reglementaire',
  id: 2,
  collectivite_id: 1,
  fichier: {
    hash: 'c9df071601f3f72b5430a55cd7ea584be5c2a36bb4226b621c4dca50088ef8b9',
    filename: 'preuve_input.txt',
    filesize: 34,
    bucket_id: '9d4ccd86-268b-4292-aeda-18bfbe6496df',
    confidentiel: false,
  },
  lien: null,
  commentaire: 'commentaire preuve fichier',
  created_at: '2022-09-06T16:43:41.423515+00:00',
  created_by: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  created_by_nom: 'Yolo Dodo',
  action: {
    action_id: 'eci_1.1.3',
    identifiant: '1.1.3',
  },
  preuve_reglementaire: {
    id: 'etude_vulnerabilite',
    nom: 'Etude de vulnérabilité au changement climatique',
    description:
      'PCAET avec EES et résumé non technique ; éventuel bilan intermédiaire Preuve identique à la 1.1.1.3',
  },
  demande: null,
  audit: null,
  rapport: null,
};

const toAttendu = (
  documents: [DocumentReglementaire, ...DocumentReglementaire[]]
): DocumentAttendu => ({
  action: documents[0].action,
  preuve_reglementaire: documents[0].preuve_reglementaire,
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
  preuve_type: 'complementaire',
  id: 3,
  collectivite_id: 1,
  fichier: null,
  lien: {
    url: 'http://yolo.dodo',
    titre: 'dodo',
  },
  commentaire: '',
  created_at: '2022-09-06T16:46:39.744518+00:00',
  created_by: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  created_by_nom: 'Yolo Dodo',
  action: {
    action_id: 'eci_1.1.3',
    identifiant: '1.1.3',
  },
  preuve_reglementaire: null,
  demande: null,
  audit: null,
  rapport: null,
};

export const preuveComplementaireFichier: PreuveComplementaire = {
  preuve_type: 'complementaire',
  id: 4,
  collectivite_id: 1,
  fichier: {
    hash: 'c9df071601f3f72b5430a55cd7ea584be5c2a36bb4226b621c4dca50088ef8b9',
    filename: 'preuve_input.txt',
    filesize: 34,
    bucket_id: '9d4ccd86-268b-4292-aeda-18bfbe6496df',
    confidentiel: false,
  },
  lien: null,
  commentaire: 'lala',
  created_at: '2022-09-06T16:46:31.355212+00:00',
  created_by: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  created_by_nom: 'Yolo Dodo',
  action: {
    action_id: 'eci_1.1.3',
    identifiant: '1.1.3',
  },
  preuve_reglementaire: null,
  demande: null,
  audit: null,
  rapport: null,
};
