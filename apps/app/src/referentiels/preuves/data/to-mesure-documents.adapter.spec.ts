import { describe, expect, test } from 'vitest';
import { toMesureDocuments } from './to-mesure-documents.adapter';

const mesure = { actionId: 'eci_1.1.4', identifiant: '1.1.4' };

const definition = {
  id: 'delib_strategie_eci',
  nom: 'Délibération de stratégie',
  description: 'La délibération qui engage la collectivité',
};

const commonFields = {
  id: 12,
  collectiviteId: 1,
  commentaire: 'un commentaire',
  modifiedAt: '2026-09-01T10:00:00.000Z',
  modifiedBy: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  modifiedByNom: 'Yolo Dodo',
  action: mesure,
};

const fichierOutput = {
  id: 3,
  collectiviteId: 1,
  hash: 'c9df0716',
  filename: 'diagnostic.pdf',
  confidentiel: false,
  bucketId: '9d4ccd86-268b-4292-aeda-18bfbe6496df',
  filesize: 34,
};

const lienOutput = {
  url: 'https://example.com/strategie',
  titre: 'strategie',
};

const documentAvecFichier = {
  ...commonFields,
  preuveType: 'reglementaire' as const,
  preuveReglementaire: definition,
  fichier: fichierOutput,
  lien: null,
};

const complementaireAvecLien = {
  ...commonFields,
  id: 13,
  preuveType: 'complementaire' as const,
  fichier: null,
  lien: lienOutput,
};

const attendu = (documents: (typeof documentAvecFichier)[]) => ({
  preuveReglementaire: definition,
  action: mesure,
  documents,
});

describe('toMesureDocuments', () => {
  test("rend l'attendu sous les clés que le front consomme, sans document déposé", () => {
    expect(
      toMesureDocuments({ attendus: [attendu([])], complementaires: [] })
    ).toEqual({
      attendus: [
        {
          action: { action_id: 'eci_1.1.4', identifiant: '1.1.4' },
          preuve_reglementaire: definition,
          documents: [],
        },
      ],
      complementaires: [],
    });
  });

  test('traduit un document porté par un fichier dans la forme de la bibliothèque', () => {
    const { attendus } = toMesureDocuments({
      attendus: [attendu([documentAvecFichier])],
      complementaires: [],
    });

    expect(attendus[0].documents[0]).toEqual({
      id: 12,
      collectivite_id: 1,
      commentaire: 'un commentaire',
      created_at: '2026-09-01T10:00:00.000Z',
      created_by: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
      created_by_nom: 'Yolo Dodo',
      action: { action_id: 'eci_1.1.4', identifiant: '1.1.4' },
      preuve_type: 'reglementaire',
      preuve_reglementaire: definition,
      demande: null,
      audit: null,
      rapport: null,
      fichier: {
        hash: 'c9df0716',
        filename: 'diagnostic.pdf',
        filesize: 34,
        confidentiel: false,
        bucket_id: '9d4ccd86-268b-4292-aeda-18bfbe6496df',
      },
      lien: null,
    });
  });

  test("rend un complémentaire porté par un lien, sans définition d'attendu", () => {
    const { complementaires } = toMesureDocuments({
      attendus: [],
      complementaires: [complementaireAvecLien],
    });

    expect(complementaires[0]).toMatchObject({
      id: 13,
      preuve_type: 'complementaire',
      preuve_reglementaire: null,
      action: { action_id: 'eci_1.1.4', identifiant: '1.1.4' },
      fichier: null,
      lien: lienOutput,
    });
  });
});
