import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { toDocumentHash } from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { ResourceType } from '@tet/domain/users';
import { describe, expect, it, vi, type Mock } from 'vitest';
import type {
  DocumentScope,
  DocumentScopeKind,
} from '@tet/backend/collectivites/documents/list-documents-by-scope/document-scope';
import type {
  CollectedDocuments,
  CollectedFile,
} from '@tet/backend/collectivites/documents/list-documents-by-scope/triage-documents';
import { CollectAuditPreuvesService } from './collect-audit-preuves.service';

const HASH_1 = toDocumentHash('1'.repeat(64));

const user = { id: 'user-id' } as AuthenticatedUser;

const referentielId: ReferentielId = 'cae';

const baseInput = {
  collectiviteId: 1,
  referentielId,
  auditId: 10,
  demandeId: 20,
  user,
};

type CollectedScopeKind = Extract<
  DocumentScopeKind,
  'complementaire' | 'reglementaire' | 'labellisation' | 'audit'
>;

const emptyDocuments: CollectedDocuments = {
  files: [],
  missingFiles: [],
  links: [],
};

function buildService({
  complementaire = emptyDocuments,
  reglementaire = emptyDocuments,
  labellisation = emptyDocuments,
  audit = emptyDocuments,
  canReadConfidentiel = true,
}: {
  complementaire?: CollectedDocuments;
  reglementaire?: CollectedDocuments;
  labellisation?: CollectedDocuments;
  audit?: CollectedDocuments;
  canReadConfidentiel?: boolean;
} = {}): {
  service: CollectAuditPreuvesService;
  permissionsIsAllowed: Mock;
  listDocuments: Mock;
} {
  const byScope: Record<CollectedScopeKind, CollectedDocuments> = {
    complementaire,
    reglementaire,
    labellisation,
    audit,
  };
  const listDocuments = vi
    .fn()
    .mockImplementation((scope: { kind: CollectedScopeKind }) =>
      Promise.resolve({ success: true, data: byScope[scope.kind] })
    );
  const repository = { listDocuments };

  const permissionResult = canReadConfidentiel
    ? { success: true, data: undefined }
    : { success: false, error: 'UNAUTHORIZED' };
  const permissionsIsAllowed = vi.fn().mockResolvedValue(permissionResult);

  const service = new CollectAuditPreuvesService(
    repository as never,
    {
      isAllowed: permissionsIsAllowed,
    } as never
  );

  return { service, permissionsIsAllowed, listDocuments };
}

function makeFile(overrides: Partial<CollectedFile> = {}): CollectedFile {
  return {
    bucketId: 'bucket-1',
    hash: HASH_1,
    filename: 'doc.pdf',
    filesize: 1024,
    actionId: null,
    ...overrides,
  };
}

describe('CollectAuditPreuvesService', () => {
  it('interroge la permission `collectivites.documents.read_confidentiel` sur la collectivité', async () => {
    const { service, permissionsIsAllowed } = buildService();

    await service.collect(baseInput);

    expect(permissionsIsAllowed).toHaveBeenCalledWith(
      user,
      'collectivites.documents.read_confidentiel',
      ResourceType.COLLECTIVITE,
      { collectiviteId: 1 }
    );
  });

  it('ferme le confidentiel sur les quatre portées quand la permission est refusée', async () => {
    const { service, listDocuments } = buildService({
      canReadConfidentiel: false,
    });

    await service.collect(baseInput);

    const scopes: DocumentScope[] = listDocuments.mock.calls.map(
      ([scope]) => scope
    );
    expect(
      scopes.map(({ kind, canReadConfidentiel }) => ({
        kind,
        canReadConfidentiel,
      }))
    ).toEqual([
      { kind: 'complementaire', canReadConfidentiel: false },
      { kind: 'reglementaire', canReadConfidentiel: false },
      { kind: 'labellisation', canReadConfidentiel: false },
      { kind: 'audit', canReadConfidentiel: false },
    ]);
  });

  it('transmet le referentielId aux portées mesure (complémentaire et réglementaire)', async () => {
    const { service, listDocuments } = buildService();

    await service.collect(baseInput);

    expect(listDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'complementaire', referentielId })
    );
    expect(listDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'reglementaire', referentielId })
    );
  });

  it('fusionne complémentaires et réglementaires sous le bucket `mesure`', async () => {
    const { service } = buildService({
      complementaire: {
        files: [makeFile({ actionId: 'cae_1.1.1', filename: 'comp.pdf' })],
        missingFiles: [],
        links: [],
      },
      reglementaire: {
        files: [makeFile({ actionId: 'cae_1.1.1', filename: 'regl.pdf' })],
        missingFiles: [],
        links: [],
      },
    });

    const result = await service.collect(baseInput);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.mesure.files.map((file) => file.filename)).toEqual([
      'comp.pdf',
      'regl.pdf',
    ]);
  });

  it("propage l'échec d'une portée en échec de collecte", async () => {
    const cause = new Error('connexion perdue');
    const listDocuments = vi
      .fn()
      .mockImplementation(async (scope: { kind: CollectedScopeKind }) => {
        if (scope.kind === 'complementaire') {
          return {
            success: false,
            error: 'LIST_DOCUMENTS_BY_SCOPE_ERROR',
            cause,
          };
        }
        return { success: true, data: emptyDocuments };
      });
    const service = new CollectAuditPreuvesService(
      { listDocuments } as never,
      {
        isAllowed: vi
          .fn()
          .mockResolvedValue({ success: true, data: undefined }),
      } as never
    );

    const result = await service.collect(baseInput);

    expect(result).toEqual({
      success: false,
      error: 'COLLECT_PREUVES_ERROR',
      cause,
    });
  });
});
