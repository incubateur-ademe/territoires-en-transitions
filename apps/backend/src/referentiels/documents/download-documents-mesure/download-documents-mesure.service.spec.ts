import { ListDocumentsByScopeRepository } from '@tet/backend/collectivites/documents/list-documents-by-scope/list-documents-by-scope.repository';
import type {
  CollectedDocuments,
  CollectedFile,
} from '@tet/backend/collectivites/documents/list-documents-by-scope/triage-documents';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { ArchiveAssemblyService } from '@tet/backend/utils/archive/archive-assembly.service';
import type { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import type { Writable } from 'node:stream';
import { failure, success } from '@tet/backend/utils/result.type';
import { toDocumentHash } from '@tet/domain/collectivites';
import { describe, expect, test, vi, type Mock } from 'vitest';
import { ReferentielDocumentsAccessService } from '../referentiel-documents-access.service';
import { DownloadDocumentsMesureErrorEnum } from './download-documents-mesure.errors';
import { DownloadDocumentsMesureService } from './download-documents-mesure.service';

const ACTION_ID = 'cae_1.1.2';

const toFile = (index: number): CollectedFile => ({
  bucketId: 'collectivite-1',
  hash: toDocumentHash(String(index).padStart(64, '0')),
  filename: `document-${index}.pdf`,
  filesize: 1024,
  actionId: ACTION_ID,
});

const toDocuments = (count: number): CollectedDocuments => ({
  files: Array.from({ length: count }, (_, index) => toFile(index)),
  missingFiles: [],
  links: [],
});

function buildService({
  documentCount = 1,
  canReadConfidentiel = true,
  canReadDocuments = true,
  documentsRead = true,
  archiveAssembled = true,
}: {
  documentCount?: number;
  canReadConfidentiel?: boolean;
  canReadDocuments?: boolean;
  documentsRead?: boolean;
  archiveAssembled?: boolean;
} = {}): {
  service: DownloadDocumentsMesureService;
  listDocuments: Mock;
} {
  const listDocuments = vi
    .fn()
    .mockResolvedValue(
      documentsRead
        ? success(toDocuments(documentCount))
        : failure(
            'LIST_DOCUMENTS_BY_SCOPE_ERROR',
            new Error('connexion perdue')
          )
    );

  const checkUserCanReadDocuments = vi
    .fn()
    .mockResolvedValue(
      canReadDocuments
        ? success({ canReadConfidentiel })
        : failure('UNAUTHORIZED')
    );

  const documents = {
    listDocuments,
  } as unknown as ListDocumentsByScopeRepository;
  const referentielDocumentsAccess = {
    checkUserCanReadDocuments,
  } as unknown as ReferentielDocumentsAccessService;
  const collectivites = {
    getCollectivite: async () => ({ collectivite: { nom: 'Ambérieu' } }),
  } as unknown as CollectivitesService;
  const archives = {
    assembleZip: vi
      .fn()
      .mockResolvedValue(
        archiveAssembled
          ? success({ totalFiles: documentCount })
          : failure('ASSEMBLE_ZIP_ERROR')
      ),
  } as unknown as ArchiveAssemblyService;

  const service = new DownloadDocumentsMesureService(
    documents,
    referentielDocumentsAccess,
    collectivites,
    archives
  );

  return { service, listDocuments };
}

const user = { id: 'user-1' } as AuthenticatedUser;

const input = { collectiviteId: 1, actionId: ACTION_ID };

describe('DownloadDocumentsMesureService.prepareArchive', () => {
  test('demande les documents de la mesure et de ses sous-mesures', async () => {
    const { service, listDocuments } = buildService();

    await service.prepareArchive(input, { user });

    expect(listDocuments).toHaveBeenCalledWith({
      kind: 'mesure',
      collectiviteId: 1,
      actionId: ACTION_ID,
      withSubActions: true,
      canReadConfidentiel: true,
    });
  });

  test('ferme le confidentiel quand la permission est refusée', async () => {
    const { service, listDocuments } = buildService({
      canReadConfidentiel: false,
    });

    await service.prepareArchive(input, { user });

    expect(listDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ canReadConfidentiel: false })
    );
  });

  test("refuse la lecture à qui n'a pas accès aux documents du référentiel", async () => {
    const { service, listDocuments } = buildService({
      canReadDocuments: false,
    });

    const result = await service.prepareArchive(input, { user });

    expect(result).toMatchObject({
      success: false,
      error: DownloadDocumentsMesureErrorEnum.UNAUTHORIZED,
    });
    expect(listDocuments).not.toHaveBeenCalled();
  });

  test('refuse un identifiant de mesure qui ne désigne aucun référentiel', async () => {
    const { service } = buildService();

    const result = await service.prepareArchive(
      { collectiviteId: 1, actionId: 'inconnu' },
      { user }
    );

    expect(result).toMatchObject({
      success: false,
      error: DownloadDocumentsMesureErrorEnum.UNKNOWN_REFERENTIEL,
    });
  });

  test('refuse une mesure sans aucun document téléchargeable', async () => {
    const { service } = buildService({ documentCount: 0 });

    const result = await service.prepareArchive(input, { user });

    expect(result).toMatchObject({
      success: false,
      error: DownloadDocumentsMesureErrorEnum.NO_DOCUMENT,
    });
  });

  test('refuse une mesure portant plus de 100 documents', async () => {
    const { service } = buildService({ documentCount: 101 });

    const result = await service.prepareArchive(input, { user });

    expect(result).toMatchObject({
      success: false,
      error: DownloadDocumentsMesureErrorEnum.ARCHIVE_TOO_LARGE,
    });
  });

  test('rend une erreur serveur quand la lecture des documents échoue', async () => {
    const { service } = buildService({ documentsRead: false });

    const result = await service.prepareArchive(input, { user });

    expect(result).toMatchObject({
      success: false,
      error: DownloadDocumentsMesureErrorEnum.SERVER_ERROR,
    });
  });

  test("rend une erreur d'assemblage quand l'écriture du zip échoue", async () => {
    const { service } = buildService({ archiveAssembled: false });

    const prepareResult = await service.prepareArchive(input, { user });
    expect(prepareResult.success).toBe(true);
    if (!prepareResult.success) return;

    const writeResult = await prepareResult.data.writeTo(
      null as unknown as Writable
    );

    expect(writeResult).toMatchObject({
      success: false,
      error: DownloadDocumentsMesureErrorEnum.BUILD_ARCHIVE_ERROR,
    });
  });

  test('accepte une mesure portant exactement 100 documents', async () => {
    const { service } = buildService({ documentCount: 100 });

    const result = await service.prepareArchive(input, { user });

    expect(result).toMatchObject({
      success: true,
      data: { filename: 'cae_1.1.2_Ambérieu.zip' },
    });
  });
});
