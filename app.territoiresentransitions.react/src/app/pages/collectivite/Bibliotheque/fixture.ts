import {TPreuveComplementaire, TPreuveReglementaire} from './types';

export const preuveReglementaireNonRenseignee: TPreuveReglementaire = {
  preuve_type: 'reglementaire',
  id: null,
  collectivite_id: 1,
  fichier: null,
  lien: null,
  commentaire: null,
  created_at: null,
  created_by: null,
  created_by_nom: 'Équipe territoires en transitions',
  action: {
    nom: "Réaliser le diagnostic de l'économie circulaire",
    concerne: true,
    action_id: 'eci_1.1.2',
    desactive: false,
    description: 'description action...',
    identifiant: '1.1.2',
    referentiel: 'eci',
  },
  preuve_reglementaire: {
    id: 'pcaet_deliberation',
    nom: "Délibération d'engagement dans la Convention des Maires",
    description:
      'PCAET avec EES et résumé non technique ; éventuel bilan intermédiaire Preuve identique à la 1.1.1.3',
  },
  demande: null,
  rapport: null,
};

export const preuveReglementaireLien: TPreuveReglementaire = {
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
    nom: 'Élargir la gouvernance en interne et en externe',
    concerne: true,
    action_id: 'eci_1.1.3',
    desactive: false,
    description:
      '<p>La collectivité met en place une gouvernance élargie permettant de construire une stratégie et des actions Economie Circulaire  en adéquation avec la réalité du  territoire. Co-construite avec les acteurs du territoire, la stratégie Economie Circulaire sera ainsi  soutenue par les acteurs du territoire lors de  sa mise en œuvre.</p>\n',
    identifiant: '1.1.3',
    referentiel: 'eci',
  },
  preuve_reglementaire: {
    id: 'agenda',
    nom: 'Agenda 21 / Agenda 2030',
    description:
      'PCAET avec EES et résumé non technique ; éventuel bilan intermédiaire Preuve identique à la 1.1.1.3',
  },
  demande: null,
  rapport: null,
};

export const preuveReglementaireLienSansDescription: TPreuveReglementaire = {
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
    nom: 'Élargir la gouvernance en interne et en externe',
    concerne: true,
    action_id: 'eci_1.1.4',
    desactive: false,
    description: 'description action...',
    identifiant: '1.1.4',
    referentiel: 'eci',
  },
  preuve_reglementaire: {
    id: 'etude_vulnerabilite',
    nom: 'Etude de vulnérabilité au changement climatique',
    description: '',
  },
  demande: null,
  rapport: null,
};

export const preuveReglementaireFichier: TPreuveReglementaire = {
  preuve_type: 'reglementaire',
  id: 2,
  collectivite_id: 1,
  fichier: {
    hash: 'c9df071601f3f72b5430a55cd7ea584be5c2a36bb4226b621c4dca50088ef8b9',
    filename: 'preuve_input.txt',
    filesize: 34,
    bucket_id: '9d4ccd86-268b-4292-aeda-18bfbe6496df',
  },
  lien: null,
  commentaire: 'commentaire preuve fichier',
  created_at: '2022-09-06T16:43:41.423515+00:00',
  created_by: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  created_by_nom: 'Yolo Dodo',
  action: {
    nom: 'Élargir la gouvernance en interne et en externe',
    concerne: true,
    action_id: 'eci_1.1.3',
    desactive: false,
    description:
      '<p>La collectivité met en place une gouvernance élargie permettant de construire une stratégie et des actions Economie Circulaire  en adéquation avec la réalité du  territoire. Co-construite avec les acteurs du territoire, la stratégie Economie Circulaire sera ainsi  soutenue par les acteurs du territoire lors de  sa mise en œuvre.</p>\n',
    identifiant: '1.1.3',
    referentiel: 'eci',
  },
  preuve_reglementaire: {
    id: 'etude_vulnerabilite',
    nom: 'Etude de vulnérabilité au changement climatique',
    description:
      'PCAET avec EES et résumé non technique ; éventuel bilan intermédiaire Preuve identique à la 1.1.1.3',
  },
  demande: null,
  rapport: null,
};

export const preuveComplementaireLien: TPreuveComplementaire = {
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
    nom: 'Élargir la gouvernance en interne et en externe',
    concerne: true,
    action_id: 'eci_1.1.3',
    desactive: false,
    description:
      '<p>La collectivité met en place une gouvernance élargie permettant de construire une stratégie et des actions Economie Circulaire  en adéquation avec la réalité du  territoire. Co-construite avec les acteurs du territoire, la stratégie Economie Circulaire sera ainsi  soutenue par les acteurs du territoire lors de  sa mise en œuvre.</p>\n',
    identifiant: '1.1.3',
    referentiel: 'eci',
  },
  preuve_reglementaire: null,
  demande: null,
  rapport: null,
};

export const preuveComplementaireFichier: TPreuveComplementaire = {
  preuve_type: 'complementaire',
  id: 4,
  collectivite_id: 1,
  fichier: {
    hash: 'c9df071601f3f72b5430a55cd7ea584be5c2a36bb4226b621c4dca50088ef8b9',
    filename: 'preuve_input.txt',
    filesize: 34,
    bucket_id: '9d4ccd86-268b-4292-aeda-18bfbe6496df',
  },
  lien: null,
  commentaire: 'lala',
  created_at: '2022-09-06T16:46:31.355212+00:00',
  created_by: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  created_by_nom: 'Yolo Dodo',
  action: {
    nom: 'Élargir la gouvernance en interne et en externe',
    concerne: true,
    action_id: 'eci_1.1.3',
    desactive: false,
    description:
      '<p>La collectivité met en place une gouvernance élargie permettant de construire une stratégie et des actions Economie Circulaire  en adéquation avec la réalité du  territoire. Co-construite avec les acteurs du territoire, la stratégie Economie Circulaire sera ainsi  soutenue par les acteurs du territoire lors de  sa mise en œuvre.</p>\n',
    identifiant: '1.1.3',
    referentiel: 'eci',
  },
  preuve_reglementaire: null,
  demande: null,
  rapport: null,
};
