import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { describe, expect, it, vi, type Mock } from 'vitest';
import { CollectiviteDocumentsAccessService } from './collectivite-documents-access.service';

const user: AuthenticatedUser = { id: 'user-id' } as AuthenticatedUser;

type PermissionResult =
  | { success: true; data: undefined }
  | { success: false; error: 'UNAUTHORIZED' };

const allowed: PermissionResult = { success: true, data: undefined };
const denied: PermissionResult = { success: false, error: 'UNAUTHORIZED' };

type ServiceUnderTest = {
  service: CollectiviteDocumentsAccessService;
  collectivitesService: { isPrivate: Mock };
};

function buildService({
  isCollectivitePrivate = false,
  canRead = true,
  canReadConfidentiel = false,
}: {
  isCollectivitePrivate?: boolean;
  canRead?: boolean;
  canReadConfidentiel?: boolean;
} = {}): ServiceUnderTest {
  const grantedByOperation: Record<string, boolean> = {
    'collectivites.documents.read': canRead,
    'collectivites.documents.read_confidentiel': canReadConfidentiel,
  };

  const toPermissionResult = (operation: string): PermissionResult =>
    grantedByOperation[operation] ? allowed : denied;

  const permissionService = {
    isAllowed: vi
      .fn()
      .mockImplementation((_user: AuthenticatedUser, operation: string) =>
        Promise.resolve(toPermissionResult(operation))
      ),
  };

  const collectivitesService = {
    isPrivate: vi.fn().mockResolvedValue(isCollectivitePrivate),
  };

  const service = new CollectiviteDocumentsAccessService(
    permissionService as never,
    collectivitesService as never
  );

  return { service, collectivitesService };
}

describe('CollectiviteDocumentsAccessService', () => {
  it('refuse une collectivite en acces restreint a un compte sans droit confidentiel', async () => {
    const { service } = buildService({
      isCollectivitePrivate: true,
      canRead: true,
      canReadConfidentiel: false,
    });

    const result = await service.checkUserCanReadDocuments(
      { collectiviteId: 1 },
      { user }
    );

    expect(result).toEqual({ success: false, error: 'UNAUTHORIZED' });
  });

  it('ouvre une collectivite en acces restreint, confidentiels compris, a un compte qui a le droit confidentiel', async () => {
    const { service } = buildService({
      isCollectivitePrivate: true,
      canReadConfidentiel: true,
    });

    const result = await service.checkUserCanReadDocuments(
      { collectiviteId: 1 },
      { user }
    );

    expect(result).toEqual({
      success: true,
      data: { canReadConfidentiel: true },
    });
  });

  it("ouvre une collectivite publique sans les confidentiels a un compte qui n'a que le droit de lecture", async () => {
    const { service } = buildService();

    const result = await service.checkUserCanReadDocuments(
      { collectiviteId: 1 },
      { user }
    );

    expect(result).toEqual({
      success: true,
      data: { canReadConfidentiel: false },
    });
  });

  it('ouvre une collectivite publique, confidentiels compris, a un compte qui a les deux droits', async () => {
    const { service } = buildService({ canReadConfidentiel: true });

    const result = await service.checkUserCanReadDocuments(
      { collectiviteId: 1 },
      { user }
    );

    expect(result).toEqual({
      success: true,
      data: { canReadConfidentiel: true },
    });
  });

  it('refuse une collectivite publique a un compte qui a le droit confidentiel sans le droit de lecture', async () => {
    const { service } = buildService({
      isCollectivitePrivate: false,
      canRead: false,
      canReadConfidentiel: true,
    });

    const result = await service.checkUserCanReadDocuments(
      { collectiviteId: 1 },
      { user }
    );

    expect(result).toEqual({ success: false, error: 'UNAUTHORIZED' });
  });

  it("refuse un compte sans aucun droit de lecture sans consulter l'acces restreint", async () => {
    const { service, collectivitesService } = buildService({ canRead: false });

    const result = await service.checkUserCanReadDocuments(
      { collectiviteId: 1 },
      { user }
    );

    expect(result).toEqual({ success: false, error: 'UNAUTHORIZED' });
    expect(collectivitesService.isPrivate).not.toHaveBeenCalled();
  });
});
