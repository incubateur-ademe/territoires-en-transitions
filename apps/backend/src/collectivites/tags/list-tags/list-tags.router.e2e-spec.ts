import { getAuthUser, getTestRouter } from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { AppRouter, TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { TagEnum } from '@tet/domain/collectivites';
import { inferProcedureInput } from '@trpc/server';
import { beforeAll, describe, expect, onTestFinished, test } from 'vitest';

type ListTagsInput = inferProcedureInput<
  AppRouter['collectivites']['tags']['list']
>;

describe('ListTagsRouter', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser();
  });

  test('list should be authorized for visitor user', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: ListTagsInput = {
      collectiviteId: 9999,
      tagType: TagEnum.Libre,
    };

    await expect(() => caller.collectivites.tags.list(input)).not.toThrow();
  });

  test('should list libre tags for a collectivite', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const createdTag = await caller.collectivites.tags.create({
      tagType: TagEnum.Libre,
      nom: 'Tag list e2e',
      collectiviteId: 1,
    });

    onTestFinished(async () => {
      try {
        await caller.collectivites.tags.delete({
          tagType: TagEnum.Libre,
          id: createdTag.id,
          collectiviteId: 1,
        });
      } catch {
        // ignore if already deleted
      }
    });

    const input: ListTagsInput = {
      collectiviteId: 1,
      tagType: TagEnum.Libre,
    };

    const result = await caller.collectivites.tags.list(input);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    const found = result.find((tag) => tag.id === createdTag.id);
    expect(found).toBeDefined();
    expect(found?.nom).toBe('Tag list e2e');
    expect(found?.collectiviteId).toBe(1);
  });
});
