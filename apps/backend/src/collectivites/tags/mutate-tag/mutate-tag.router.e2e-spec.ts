import { getAuthUser, getTestRouter } from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { TagEnum } from '@tet/domain/collectivites';
import { beforeAll, describe, expect, onTestFinished, test } from 'vitest';

describe('MutateTagRouter', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser();
  });

  test('create should be unauthorized for collectivite without rights', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    await expect(
      caller.collectivites.tags.create({
        tagType: TagEnum.Libre,
        nom: 'Tag non autorisé',
        collectiviteId: 9999,
      })
    ).rejects.toThrow();
  });

  test('should create, update and delete a libre tag', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const created = await caller.collectivites.tags.create({
      tagType: TagEnum.Libre,
      nom: 'Tag e2e',
      collectiviteId: 1,
    });

    expect(created).toBeDefined();
    expect(created.id).toBeDefined();
    expect(created.nom).toBe('Tag e2e');
    expect(created.collectiviteId).toBe(1);

    const updated = await caller.collectivites.tags.update({
      tagType: TagEnum.Libre,
      id: created.id,
      collectiviteId: 1,
      nom: 'Tag e2e modifié',
    });

    expect(updated).toBeDefined();
    expect(updated.id).toBe(created.id);
    expect(updated.nom).toBe('Tag e2e modifié');
    expect(updated.collectiviteId).toBe(1);

    await caller.collectivites.tags.delete({
      tagType: TagEnum.Libre,
      id: created.id,
      collectiviteId: 1,
    });

    onTestFinished(async () => {
      // Ensure the tag is deleted even if the test fails before delete
      try {
        await caller.collectivites.tags.delete({
          tagType: TagEnum.Libre,
          id: created.id,
          collectiviteId: 1,
        });
      } catch {
        // Ignore if already deleted
      }
    });
  });
});
