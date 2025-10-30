import { TPreuveAuditEtLabellisation } from '@/app/referentiels/preuves/Bibliotheque/types';
import { describe, expect, test } from 'vitest';
import { groupeParReferentielEtDemande } from './groupeParReferentielEtDemande';

describe('groupeParReferentielEtDemande', () => {
  test('doit grouper les documents par référentiel et demande', () => {
    expect(
      groupeParReferentielEtDemande([
        ...preuves_demande1,
        ...preuves_demande2,
        ...preuves_audit_sans_demande,
      ])
    ).toMatchObject({
      eci: {
        61: preuves_demande1,
        62: preuves_demande2,
      },
      cae: {
        100: preuves_audit_sans_demande,
      },
    });
  });
});

const preuves_demande1 = [
  {
    preuve_type: 'labellisation',
    id: 8,
    collectivite_id: 1,
    fichier: {
      hash: '63eea835e75300272117b7e926040bf59a1b6c583f6969ea141f6ff9fcb5c6ee',
      filename: 'doc1.pdf',
      filesize: 978700,
      bucket_id: '576b747e-bb30-4407-8d8c-566daf9e7a2d',
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
    },
    rapport: null,
    audit: null,
  },
  {
    preuve_type: 'labellisation',
    id: 7,
    collectivite_id: 1,
    fichier: {
      hash: '071a0b09051aa4cacf39f85860ddb775e668336517eaf1ec3cda16fda9028b3f',
      filename: 'doc2.pdf',
      filesize: 66632,
      bucket_id: '576b747e-bb30-4407-8d8c-566daf9e7a2d',
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
    },
    rapport: null,
    audit: {
      collectivite_id: 1,
      date_debut: '2023-02-22T18:34:42.460935+00:00',
      date_fin: null,
      id: 100,
      referentiel: 'eci',
      valide: true,
    },
  },
] as TPreuveAuditEtLabellisation[];

const preuves_demande2 = [
  {
    preuve_type: 'labellisation',
    id: 9,
    collectivite_id: 1,
    fichier: {
      hash: '63eea835e75300272117b7e926040bf59a1b6c583f6969ea141f6ff9fcb5c6ee',
      filename: 'doc1.pdf',
      filesize: 978700,
      bucket_id: '576b747e-bb30-4407-8d8c-566daf9e7a2d',
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
    },
    rapport: null,
    audit: null,
  },
] as TPreuveAuditEtLabellisation[];

const preuves_audit_sans_demande = [
  {
    preuve_type: 'audit',
    id: 10,
    collectivite_id: 1,
    fichier: {
      hash: '63eea835e75300272117b7e926040bf59a1b6c583f6969ea141f6ff9fcb5c6ee',
      filename: 'doc1.pdf',
      filesize: 978700,
      bucket_id: '576b747e-bb30-4407-8d8c-566daf9e7a2d',
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
      collectivite_id: 1,
      demande_id: null,
      date_debut: '2023-02-22T18:34:42.460935+00:00',
      date_fin: null,
      id: 100,
      referentiel_id: 'cae',
      valide: true,
    },
  },
] as TPreuveAuditEtLabellisation[];
