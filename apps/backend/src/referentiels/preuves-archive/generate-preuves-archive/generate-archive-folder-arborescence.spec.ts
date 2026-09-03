import { ActionTypeEnum } from '@tet/domain/referentiels';
import { describe, expect, it } from 'vitest';
import type { PreuvesByOrigin } from '../collect-audit-preuves/collect-audit-preuves.service';
import type {
  CollectedFilePreuve,
  CollectedLinkPreuve,
  CollectedPreuves,
} from '../collect-audit-preuves/collect-preuves.repository';
import {
  generateArchiveFolderArborescence,
  type GenerateArchiveFolderArborescenceInput,
  type ReferentielTreeNode,
} from './generate-archive-folder-arborescence';

const referentielTree: ReferentielTreeNode = {
  actionId: 'cae',
  actionType: ActionTypeEnum.REFERENTIEL,
  identifiant: '',
  nom: 'CAE',
  actionsEnfant: [
    {
      actionId: 'cae_1',
      actionType: ActionTypeEnum.AXE,
      identifiant: '1',
      nom: 'Axe un',
      actionsEnfant: [
        {
          actionId: 'cae_1.1',
          actionType: ActionTypeEnum.SOUS_AXE,
          identifiant: '1.1',
          nom: 'Sous-axe un',
          actionsEnfant: [
            {
              actionId: 'cae_1.1.1',
              actionType: ActionTypeEnum.ACTION,
              identifiant: '1.1.1',
              nom: 'Mesure un',
              actionsEnfant: [
                {
                  actionId: 'cae_1.1.1.1',
                  actionType: ActionTypeEnum.SOUS_ACTION,
                  identifiant: '1.1.1.1',
                  nom: 'Sous-action',
                  actionsEnfant: [],
                },
              ],
            },
            {
              actionId: 'cae_1.1.2',
              actionType: ActionTypeEnum.ACTION,
              identifiant: '1.1.2',
              nom: 'Mesure deux',
              actionsEnfant: [],
            },
          ],
        },
      ],
    },
  ],
};

function makeFile(
  overrides: Partial<CollectedFilePreuve> = {}
): CollectedFilePreuve {
  return {
    bucketId: 'bucket-1',
    hash: 'hash-1',
    filename: 'doc.pdf',
    filesize: 1024,
    actionId: null,
    ...overrides,
  };
}

function makeLink(
  overrides: Partial<CollectedLinkPreuve> = {}
): CollectedLinkPreuve {
  return {
    url: 'https://example.org',
    titre: 'Un lien',
    commentaire: '',
    actionId: null,
    ...overrides,
  };
}

const empty: CollectedPreuves = { files: [], missingFiles: [], links: [] };

function buildInput(
  preuves: Partial<Record<keyof PreuvesByOrigin, Partial<CollectedPreuves>>> = {}
): GenerateArchiveFolderArborescenceInput {
  return {
    preuves: {
      mesure: { ...empty, ...preuves.mesure },
      demande: { ...empty, ...preuves.demande },
      audit: { ...empty, ...preuves.audit },
    },
    referentielTree,
  };
}

describe('generateArchiveFolderArborescence', () => {
  it('range les preuves de mesure dans mesures/<axe>/<sous-axe>/<mesure>/', () => {
    const result = generateArchiveFolderArborescence(
      buildInput({
        mesure: {
          files: [makeFile({ actionId: 'cae_1.1.1', filename: 'a.pdf' })],
          links: [],
        },
      })
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.files).toEqual([
      {
        folderSegments: [
          'mesures',
          '1 Axe un',
          '1.1 Sous-axe un',
          '1.1.1 Mesure un',
        ],
        filename: 'a.pdf',
        bucketId: 'bucket-1',
        hash: 'hash-1',
        filesize: 1024,
      },
    ]);
  });

  it('range les preuves de cycle dans cycle-labellisation/demande et /audit', () => {
    const result = generateArchiveFolderArborescence(
      buildInput({
        demande: { files: [makeFile({ filename: 'demande.pdf' })], links: [] },
        audit: { files: [makeFile({ filename: 'audit.pdf' })], links: [] },
      })
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(
      result.data.files.map((file) => ({
        filename: file.filename,
        folderSegments: file.folderSegments,
      }))
    ).toEqual([
      {
        filename: 'demande.pdf',
        folderSegments: ['cycle-labellisation', 'demande'],
      },
      {
        filename: 'audit.pdf',
        folderSegments: ['cycle-labellisation', 'audit'],
      },
    ]);
  });

  it('remonte une preuve de sous-action dans le dossier de sa mesure ancetre', () => {
    const result = generateArchiveFolderArborescence(
      buildInput({
        mesure: {
          files: [makeFile({ actionId: 'cae_1.1.1.1', filename: 'sa.pdf' })],
          links: [],
        },
      })
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.files[0].folderSegments).toEqual([
      'mesures',
      '1 Axe un',
      '1.1 Sous-axe un',
      '1.1.1 Mesure un',
    ]);
  });

  it('ignore un fichier trop volumineux et le consigne', () => {
    const result = generateArchiveFolderArborescence(
      buildInput({
        mesure: {
          files: [
            makeFile({
              actionId: 'cae_1.1.1',
              filename: 'gros.zip',
              filesize: 200 * 1024 * 1024,
            }),
            makeFile({ actionId: 'cae_1.1.1', filename: 'ok.pdf' }),
          ],
          links: [],
        },
      })
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.files.map((file) => file.filename)).toEqual(['ok.pdf']);
    expect(result.data.skippedFiles).toHaveLength(1);
    expect(result.data.skippedFiles[0]).toMatchObject({
      filename: 'gros.zip',
      emplacement: 'mesures/1 Axe un/1.1 Sous-axe un/1.1.1 Mesure un',
    });
  });

  it('consigne un fichier absent du stockage dans le dossier de sa mesure', () => {
    const result = generateArchiveFolderArborescence(
      buildInput({
        mesure: {
          missingFiles: [
            {
              hash: 'hash-purge',
              filename: 'avis-technique.pdf',
              actionId: 'cae_1.1.1',
            },
          ],
        },
      })
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.files).toEqual([]);
    expect(result.data.skippedFiles).toEqual([
      {
        filename: 'avis-technique.pdf',
        emplacement: 'mesures/1 Axe un/1.1 Sous-axe un/1.1.1 Mesure un',
        raison: 'Fichier introuvable dans le stockage',
      },
    ]);
  });

  it('consigne un fichier absent du stockage sans filename sous son hash', () => {
    const result = generateArchiveFolderArborescence(
      buildInput({
        audit: {
          missingFiles: [
            { hash: 'hash-sans-nom', filename: null, actionId: null },
          ],
        },
      })
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.skippedFiles).toEqual([
      {
        filename: 'hash-sans-nom',
        emplacement: 'cycle-labellisation/audit',
        raison: 'Fichier introuvable dans le stockage',
      },
    ]);
  });

  it('nomme un fichier sans filename par son hash', () => {
    const result = generateArchiveFolderArborescence(
      buildInput({
        mesure: {
          files: [
            makeFile({
              actionId: 'cae_1.1.1',
              filename: null,
              hash: 'hash-sans-nom',
            }),
          ],
          links: [],
        },
      })
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.files[0].filename).toBe('hash-sans-nom');
  });

  it('ignore un fichier dont la taille est inconnue', () => {
    const result = generateArchiveFolderArborescence(
      buildInput({
        mesure: {
          files: [
            makeFile({
              actionId: 'cae_1.1.1',
              filename: 'sans-taille.pdf',
              filesize: null,
            }),
          ],
          links: [],
        },
      })
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.files).toEqual([]);
    expect(result.data.skippedFiles[0]).toMatchObject({
      filename: 'sans-taille.pdf',
      raison: 'Taille du fichier inconnue',
    });
  });

  it('rejette au-dela de 500 fichiers', () => {
    const files = Array.from({ length: 501 }, (_, index) =>
      makeFile({ actionId: 'cae_1.1.1', filename: `f-${index}.pdf` })
    );

    const result = generateArchiveFolderArborescence(
      buildInput({ mesure: { files, links: [] } })
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBe('COLLECT_PREUVES_ERROR');
  });

  it('rejette au-dela de 2 Go au total', () => {
    const files = Array.from({ length: 30 }, (_, index) =>
      makeFile({
        actionId: 'cae_1.1.1',
        filename: `f-${index}.pdf`,
        filesize: 80 * 1024 * 1024,
      })
    );

    const result = generateArchiveFolderArborescence(
      buildInput({ mesure: { files, links: [] } })
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBe('COLLECT_PREUVES_ERROR');
  });

  it('regroupe les preuves-lien par dossier', () => {
    const result = generateArchiveFolderArborescence(
      buildInput({
        mesure: {
          files: [makeFile({ actionId: 'cae_1.1.1', filename: 'doc.pdf' })],
          links: [
            makeLink({ actionId: 'cae_1.1.1', titre: 'Lien A' }),
            makeLink({ actionId: 'cae_1.1.1', titre: 'Lien B' }),
          ],
        },
        audit: {
          files: [],
          links: [makeLink({ titre: 'Lien audit', commentaire: null })],
        },
      })
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.files).toHaveLength(1);
    expect(result.data.linkFolders).toEqual([
      {
        folderSegments: [
          'mesures',
          '1 Axe un',
          '1.1 Sous-axe un',
          '1.1.1 Mesure un',
        ],
        liens: [
          { titre: 'Lien A', url: 'https://example.org', commentaire: '' },
          { titre: 'Lien B', url: 'https://example.org', commentaire: '' },
        ],
      },
      {
        folderSegments: ['cycle-labellisation', 'audit'],
        liens: [
          {
            titre: 'Lien audit',
            url: 'https://example.org',
            commentaire: '',
          },
        ],
      },
    ]);
  });
});
