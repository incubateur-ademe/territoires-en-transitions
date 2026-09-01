import { PreuveAuditEtLabellisation } from '@/app/referentiels/preuves/Bibliotheque/types';
import { describe, expect, test } from 'vitest';
import { addInfoToEntry } from './PreuveLabellisation';
import { groupeParDemande } from './groupeParDemande';

describe('groupeParDemande', () => {
  test('doit grouper les documents du référentiel courant par demande', () => {
    expect(
      groupeParDemande(
        [
          ...preuves_demande1,
          ...preuves_demande2,
          ...preuves_audit_sans_demande,
        ],
        'eci'
      )
    ).toMatchObject({
      61: preuves_demande1,
      62: preuves_demande2,
    });
  });

  test('ne doit pas inclure les documents d’un autre référentiel', () => {
    expect(
      groupeParDemande(
        [
          ...preuves_demande1,
          ...preuves_demande2,
          ...preuves_audit_sans_demande,
        ],
        'cae'
      )
    ).toMatchObject({
      100: preuves_audit_sans_demande,
    });
  });
});

const preuves_demande1: PreuveAuditEtLabellisation[] = [
  {
    preuve_type: 'labellisation',
    objet: null,
    id: 8,
    collectivite_id: 1,
    fichier: {
      hash: '63eea835e75300272117b7e926040bf59a1b6c583f6969ea141f6ff9fcb5c6ee',
      filename: 'doc1.pdf',
      filesize: 978700,
      bucket_id: '576b747e-bb30-4407-8d8c-566daf9e7a2d',
      confidentiel: false,
    },
    lien: null,
    commentaire: '',
    created_at: '2023-02-22T18:35:18.194811+00:00',
    created_by: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
    created_by_nom: 'Yolo Dodo',
    action: null,
    preuve_reglementaire: null,
    demande: {
      id: 61,
      date: '2023-02-22T18:34:42.460935+00:00',
      sujet: 'cot',
      etoiles: null,
      en_cours: true,
      referentiel: 'eci',
      collectivite_id: 1,
      modified_at: null,
      envoyee_le: null,
      demandeur: null,
      associated_collectivite_id: null,
    },
    rapport: null,
    audit: null,
  },
  {
    preuve_type: 'labellisation',
    objet: null,
    id: 7,
    collectivite_id: 1,
    fichier: {
      hash: '071a0b09051aa4cacf39f85860ddb775e668336517eaf1ec3cda16fda9028b3f',
      filename: 'doc2.pdf',
      filesize: 66632,
      bucket_id: '576b747e-bb30-4407-8d8c-566daf9e7a2d',
      confidentiel: false,
    },
    lien: null,
    commentaire: '',
    created_at: '2023-02-22T18:35:18.194653+00:00',
    created_by: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
    created_by_nom: 'Yolo Dodo',
    action: null,
    preuve_reglementaire: null,
    demande: {
      id: 61,
      date: '2023-02-22T18:34:42.460935+00:00',
      sujet: 'cot',
      etoiles: null,
      en_cours: true,
      referentiel: 'eci',
      collectivite_id: 1,
      modified_at: null,
      envoyee_le: null,
      demandeur: null,
      associated_collectivite_id: null,
    },
    rapport: null,
    audit: null,
  },
  {
    preuve_type: 'audit',
    id: 8,
    collectivite_id: 1,
    fichier: {
      hash: '7950d61a98864390bebad094002bcb7a00dabaf8bf2c48dd8d3dc6937aee2a96',
      filename: 'rapport.pdf',
      filesize: 5468713,
      bucket_id: '576b747e-bb30-4407-8d8c-566daf9e7a2d',
      confidentiel: false,
    },
    lien: null,
    commentaire: '',
    created_at: '2023-02-22T18:35:18.194653+00:00',
    created_by: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
    created_by_nom: 'Yolo Dodo',
    action: null,
    preuve_reglementaire: null,
    demande: {
      id: 61,
      date: '2023-02-22T18:34:42.460935+00:00',
      sujet: 'cot',
      etoiles: null,
      en_cours: true,
      referentiel: 'eci',
      collectivite_id: 1,
      modified_at: null,
      envoyee_le: null,
      demandeur: null,
      associated_collectivite_id: null,
    },
    rapport: null,
    audit: {
      id: 100,
      collectivite_id: 1,
      demande_id: 61,
      date_debut: '2023-02-22T18:34:42.460935+00:00',
      date_fin: null,
      clos: false,
      valide: true,
      referentiel_id: 'eci',
    },
  },
];

const preuves_demande2: PreuveAuditEtLabellisation[] = [
  {
    preuve_type: 'labellisation',
    objet: null,
    id: 9,
    collectivite_id: 1,
    fichier: {
      hash: '63eea835e75300272117b7e926040bf59a1b6c583f6969ea141f6ff9fcb5c6ee',
      filename: 'doc1.pdf',
      filesize: 978700,
      bucket_id: '576b747e-bb30-4407-8d8c-566daf9e7a2d',
      confidentiel: false,
    },
    lien: null,
    commentaire: '',
    created_at: '2023-02-22T18:35:18.194811+00:00',
    created_by: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
    created_by_nom: 'Yolo Dodo',
    action: null,
    preuve_reglementaire: null,
    demande: {
      id: 62,
      date: '2023-02-22T18:34:42.460935+00:00',
      sujet: 'labellisation',
      etoiles: '2',
      en_cours: true,
      referentiel: 'eci',
      collectivite_id: 1,
      modified_at: null,
      envoyee_le: null,
      demandeur: null,
      associated_collectivite_id: null,
    },
    rapport: null,
    audit: null,
  },
];

const preuves_audit_sans_demande: PreuveAuditEtLabellisation[] = [
  {
    preuve_type: 'audit',
    id: 10,
    collectivite_id: 1,
    fichier: {
      hash: '63eea835e75300272117b7e926040bf59a1b6c583f6969ea141f6ff9fcb5c6ee',
      filename: 'doc1.pdf',
      filesize: 978700,
      bucket_id: '576b747e-bb30-4407-8d8c-566daf9e7a2d',
      confidentiel: false,
    },
    lien: null,
    commentaire: '',
    created_at: '2023-02-22T18:35:18.194811+00:00',
    created_by: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
    created_by_nom: 'Yolo Dodo',
    action: null,
    preuve_reglementaire: null,
    demande: null,
    rapport: null,
    audit: {
      id: 100,
      collectivite_id: 1,
      demande_id: null,
      date_debut: '2023-02-22T18:34:42.460935+00:00',
      date_fin: null,
      clos: false,
      valide: true,
      referentiel_id: 'cae',
    },
  },
];

const closedCyclePreuves: PreuveAuditEtLabellisation[] = [
  {
    preuve_type: 'audit',
    id: 12,
    collectivite_id: 1,
    fichier: {
      hash: '9c1185a5c5e9fc54612808977ee8f548b2258d31c3b0f4a9e0e0f0e0f0e0f0e0',
      filename: 'rapport-final.pdf',
      filesize: 12345,
      bucket_id: '576b747e-bb30-4407-8d8c-566daf9e7a2d',
      confidentiel: false,
    },
    lien: null,
    commentaire: '',
    created_at: '2024-03-15T10:00:00.000000+00:00',
    created_by: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
    created_by_nom: 'Yolo Dodo',
    action: null,
    preuve_reglementaire: null,
    demande: {
      id: 63,
      date: '2024-01-10T00:00:00.000000+00:00',
      sujet: 'labellisation',
      etoiles: '3',
      en_cours: false,
      referentiel: 'eci',
      collectivite_id: 1,
      modified_at: null,
      envoyee_le: null,
      demandeur: null,
      associated_collectivite_id: null,
    },
    rapport: null,
    audit: {
      id: 101,
      collectivite_id: 1,
      demande_id: 63,
      date_debut: '2024-02-01T00:00:00.000000+00:00',
      date_fin: '2024-03-15T00:00:00.000000+00:00',
      clos: true,
      valide: true,
      referentiel_id: 'eci',
    },
  },
];

describe('addInfoToEntry', () => {
  test('derive l’etoile et l’annee depuis la demande quand le cycle n’a pas d’audit', () => {
    const { info } = addInfoToEntry(['62', preuves_demande2]);

    expect(info.etoile).toBe('2');
    expect(info.annee).toBe(2023);
    expect(info.audit).toBeNull();
  });

  test('date le cycle sur la fin de l’audit plutot que sur son debut ou sur la demande', () => {
    const { info } = addInfoToEntry(['63', closedCyclePreuves]);

    expect(new Date(info.timestamp).toISOString()).toBe(
      '2024-03-15T00:00:00.000Z'
    );
  });
});
