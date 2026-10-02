import type {
  DemarcheDocumentDefinition,
  DemarcheDocumentEtape,
  DemarcheDocumentFichier,
  DemarcheDocumentsSnapshot,
} from '@tet/domain/demarches';
import { describe, expect, it } from 'vitest';
import {
  toDossierArchiveArborescence,
  toDossierArchiveFilename,
} from './to-dossier-archive-arborescence';

const definition = (
  id: string,
  nom: string,
  ordre: number
): DemarcheDocumentDefinition => ({
  id,
  nom,
  description: '',
  requis: true,
  ordre,
  etape: 'both',
  substituts: [],
  substitutsDeclarables: [],
});

const fichier = (
  filename: string,
  overrides: Partial<DemarcheDocumentFichier> = {}
): DemarcheDocumentFichier => ({
  id: 1,
  filename,
  hash: `hash-${filename}`,
  bucketId: 'bucket',
  filesize: 1024,
  ...overrides,
});

const depose = (
  documentId: string,
  fichierDepose: DemarcheDocumentFichier | null,
  etape: DemarcheDocumentEtape = 'amont'
) => ({
  id: 1,
  documentId,
  etape,
  commentaire: '',
  modifiedAt: '2026-08-20T00:00:00Z',
  modifiedBy: null,
  fichier: fichierDepose,
});

const snapshot = (
  overrides: Partial<DemarcheDocumentsSnapshot>
): DemarcheDocumentsSnapshot => ({
  config: {
    additionalAmont: true,
    additionalAval: true,
    formatsAutorises: ['pdf'],
    mimeTypesAutorises: ['application/pdf'],
  },
  definitions: [
    definition('pcaet_strategie', 'Stratégie territoriale', 2),
    definition('pcaet_diagnostic', 'Diagnostic', 1),
  ],
  documents: [],
  documentsAdditional: [],
  ...overrides,
});

const filenames = (s: DemarcheDocumentsSnapshot) =>
  toDossierArchiveArborescence(s).files.map(({ filename }) => filename);

describe('toDossierArchiveArborescence', () => {
  it('préfixe chaque fichier du nom de sa pièce, dans l’ordre du modèle', () => {
    expect(
      filenames(
        snapshot({
          documents: [
            depose('pcaet_strategie', fichier('v3.pdf')),
            depose('pcaet_diagnostic', fichier('diag.pdf')),
          ],
        })
      )
    ).toEqual(['Diagnostic - diag.pdf', 'Stratégie territoriale - v3.pdf']);
  });

  it('ajoute les pièces libres après les pièces attendues, sous leur titre', () => {
    expect(
      filenames(
        snapshot({
          documents: [depose('pcaet_diagnostic', fichier('diag.pdf'))],
          documentsAdditional: [
            {
              id: 1,
              etape: 'amont',
              titre: 'Annexe cartographique',
              commentaire: '',
              modifiedAt: '2026-08-20T00:00:00Z',
              modifiedBy: null,
              fichier: fichier('cartes.pdf'),
            },
          ],
        })
      )
    ).toEqual(['Diagnostic - diag.pdf', 'Annexe cartographique - cartes.pdf']);
  });

  it('s’en tient au dossier transmis : ni reprise après les avis, ni pièce sans fichier', () => {
    expect(
      filenames(
        snapshot({
          documents: [
            depose('pcaet_diagnostic', fichier('diag.pdf')),
            depose('pcaet_diagnostic', fichier('diag-v2.pdf'), 'aval'),
            // Inclusion déclarée : la pièce est couverte, sans fichier propre.
            depose('pcaet_strategie', null),
          ],
        })
      )
    ).toEqual(['Diagnostic - diag.pdf']);
  });

  it('écarte un fichier sans stockage connu', () => {
    expect(
      filenames(
        snapshot({
          documents: [
            depose('pcaet_diagnostic', fichier('diag.pdf', { bucketId: null })),
          ],
        })
      )
    ).toEqual([]);
  });
});

describe('toDossierArchiveFilename', () => {
  it('nomme l’archive d’après la collectivité', () => {
    expect(toDossierArchiveFilename('CA du Pays Basque')).toBe(
      'Dossier PCAET - CA du Pays Basque.zip'
    );
  });
});
