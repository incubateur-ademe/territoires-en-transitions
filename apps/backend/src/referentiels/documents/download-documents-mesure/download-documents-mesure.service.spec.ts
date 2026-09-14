import type { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { success } from '@tet/backend/utils/result.type';
import { describe, expect, test, vi } from 'vitest';
import type { ListDocumentsMesureOutput } from '../list-documents-mesure/list-documents-mesure.output';
import { ListDocumentsMesureService } from '../list-documents-mesure/list-documents-mesure.service';
import { DownloadDocumentsMesureErrorEnum } from './download-documents-mesure.errors';
import { DownloadDocumentsMesureService } from './download-documents-mesure.service';

const MESURE = { actionId: 'cae_1.1.2', identifiant: '1.1.2' };

type ComplementaireFixture =
  ListDocumentsMesureOutput['complementaires'][number];

const toComplementaire = (index: number): ComplementaireFixture => ({
  id: index,
  collectiviteId: 1,
  commentaire: null,
  modifiedAt: '2026-01-01',
  modifiedBy: null,
  modifiedByNom: null,
  action: MESURE,
  preuveType: 'complementaire' as const,
  lien: null,
  fichier: {
    id: index,
    collectiviteId: 1,
    hash: String(index).padStart(64, '0'),
    filename: `document-${index}.pdf`,
    confidentiel: false,
    bucketId: 'collectivite-1',
    filesize: 1024,
  },
});

const toDocuments = (count: number): ListDocumentsMesureOutput =>
  ({
    attendus: [],
    complementaires: Array.from({ length: count }, (_, index) =>
      toComplementaire(index)
    ),
  } as unknown as ListDocumentsMesureOutput);

const toService = (documentCount: number): DownloadDocumentsMesureService =>
  new DownloadDocumentsMesureService(
    {
      listDocumentsMesure: async () => success(toDocuments(documentCount)),
    } as unknown as ListDocumentsMesureService,
    {
      getCollectivite: async () => ({ collectivite: { nom: 'Amberieu' } }),
    } as never,
    { assembleZip: vi.fn() } as never
  );

const user = { id: 'user-1' } as AuthenticatedUser;

describe('DownloadDocumentsMesureService.prepareArchive', () => {
  test('refuse une mesure portant plus de 100 documents', async () => {
    const result = await toService(101).prepareArchive(
      { collectiviteId: 1, actionId: MESURE.actionId },
      { user }
    );

    expect(result).toMatchObject({
      success: false,
      error: DownloadDocumentsMesureErrorEnum.ARCHIVE_TOO_LARGE,
    });
  });

  test('accepte une mesure portant exactement 100 documents', async () => {
    const result = await toService(100).prepareArchive(
      { collectiviteId: 1, actionId: MESURE.actionId },
      { user }
    );

    expect(result).toMatchObject({
      success: true,
      data: { filename: 'cae_1.1.2_Amberieu.zip' },
    });
  });
});
