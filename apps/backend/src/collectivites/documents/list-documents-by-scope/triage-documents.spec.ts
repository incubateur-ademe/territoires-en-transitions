import { toDocumentHash } from '@tet/domain/collectivites';
import { describe, expect, it } from 'vitest';
import {
  triageDocuments,
  type CollectedDocuments,
  type CollectedRow,
} from './triage-documents';

const hash = toDocumentHash('a'.repeat(64));

function toRow(overrides: Partial<CollectedRow> = {}): CollectedRow {
  return {
    actionId: 'cae_1.1.1',
    fichierId: 1,
    hash,
    filename: 'deliberation.pdf',
    url: null,
    titre: null,
    commentaire: null,
    fichier: { bucketId: 'bucket-1', filesize: 1024 },
    ...overrides,
  };
}

const emptyTriage: CollectedDocuments = {
  files: [],
  missingFiles: [],
  links: [],
};

describe('triageDocuments', () => {
  it('rend un fichier quand les octets sont dans le stockage', () => {
    expect(triageDocuments([toRow()])).toEqual({
      ...emptyTriage,
      files: [
        {
          bucketId: 'bucket-1',
          filesize: 1024,
          hash,
          filename: 'deliberation.pdf',
          actionId: 'cae_1.1.1',
        },
      ],
    });
  });

  it('rend un fichier manquant quand les octets sont absents du stockage', () => {
    expect(triageDocuments([toRow({ fichier: null })])).toEqual({
      ...emptyTriage,
      missingFiles: [
        { hash, filename: 'deliberation.pdf', actionId: 'cae_1.1.1' },
      ],
    });
  });

  it('rend un lien quand la ligne porte une url au lieu d un fichier', () => {
    const row = toRow({
      fichierId: null,
      hash: null,
      filename: null,
      fichier: null,
      url: 'https://exemple.fr/deliberation',
      titre: 'Délibération',
      commentaire: 'votée en conseil',
    });

    expect(triageDocuments([row])).toEqual({
      ...emptyTriage,
      links: [
        {
          url: 'https://exemple.fr/deliberation',
          titre: 'Délibération',
          commentaire: 'votée en conseil',
          actionId: 'cae_1.1.1',
        },
      ],
    });
  });

  it('écarte une ligne sans fichier dont l url est vide', () => {
    const row = toRow({
      fichierId: null,
      hash: null,
      filename: null,
      fichier: null,
      url: '',
    });

    expect(triageDocuments([row])).toEqual(emptyTriage);
  });

  it('écarte un fichier qui appartient à une autre collectivité', () => {
    expect(triageDocuments([toRow({ hash: null })])).toEqual(emptyTriage);
  });

  it('range chaque ligne dans sa catégorie sur un lot mêlé', () => {
    const rows = [
      toRow(),
      toRow({ fichier: null }),
      toRow({
        fichierId: null,
        hash: null,
        filename: null,
        fichier: null,
        url: 'https://exemple.fr/rapport',
      }),
      toRow({ hash: null }),
    ];

    const { files, missingFiles, links } = triageDocuments(rows);

    expect([files.length, missingFiles.length, links.length]).toEqual([
      1, 1, 1,
    ]);
  });
});
