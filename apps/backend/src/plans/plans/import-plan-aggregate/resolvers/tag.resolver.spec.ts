import { ListTagsService } from '@tet/backend/collectivites/tags/list-tags/list-tags.service';
import { MutateTagService } from '@tet/backend/collectivites/tags/mutate-tag/mutate-tag.service';
import {
  AuthenticatedUser,
  AuthRole,
} from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { Tag, TagEnum } from '@tet/domain/collectivites';
import { describe, expect, it, vi } from 'vitest';
import { createTagResolver } from './tag.resolver';

const mockUser: AuthenticatedUser = {
  id: 'user-123',
  role: AuthRole.AUTHENTICATED,
  isAnonymous: false,
  jwtPayload: { role: AuthRole.AUTHENTICATED },
};

// Mock Fuse
vi.mock('@tet/backend/utils/fuse/fuse.utils', () => ({
  getFuse: async () => {
    return class MockFuse {
      private items: any[];
      constructor(items: any[], private options: any) {
        this.items = items;
      }

      search(pattern: string): Array<{ item: any }> {
        // Simple mock: exact match on 'nom' field
        const results = this.items.filter((item) => {
          const nom = item.nom?.toLowerCase() || '';
          const patternLower = pattern.toLowerCase();

          // Simple similarity: check if pattern is contained in nom
          if (nom.includes(patternLower)) {
            return true;
          }

          // Or vice versa
          if (patternLower.includes(nom)) {
            return true;
          }

          return false;
        });

        return results.map((item) => ({ item }));
      }

      setCollection(items: any[]): void {
        this.items = items;
      }
    };
  },
}));

describe('createTagResolver', () => {
  const collectiviteId = 42;
  const mockTransaction = {} as Transaction;

  const createMockServices = (existingTags: Tag[] = []) => {
    return {
      listTagsService: createMockListTagsService(existingTags),
      mutateTagService: createMockMutateTagService(),
    };
  };

  const createMockListTagsService = (existingTags: Tag[] = []) => {
    return {
      listTags: vi.fn().mockResolvedValue(success(existingTags)),
    } as unknown as ListTagsService;
  };

  const createMockMutateTagService = () => {
    return {
      createTag: vi.fn().mockImplementation((tagData) => {
        return Promise.resolve(
          success({
            id: Math.floor(Math.random() * 1000),
            nom: tagData.nom,
            collectiviteId: tagData.collectiviteId,
          })
        );
      }),
    } as unknown as MutateTagService;
  };

  it('should return existing tag when fuzzy match is found', async () => {
    const existingTags: Tag[] = [
      { id: 1, nom: 'ADEME', collectiviteId } as Tag,
      { id: 2, nom: 'Région', collectiviteId } as Tag,
    ];

    const { listTagsService, mutateTagService } =
      createMockServices(existingTags);
    const { getOrCreate } = await createTagResolver(
      collectiviteId,
      listTagsService,
      mutateTagService,
      TagEnum.Financeur,
      undefined,
      mockUser
    );

    const result = await getOrCreate('ADEME');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: 1, nom: 'ADEME', collectiviteId });
      expect(mutateTagService.createTag).not.toHaveBeenCalled();
    }
  });

  it('should create new tag when no match is found', async () => {
    const existingTags: Tag[] = [
      { id: 1, nom: 'ADEME', collectiviteId } as Tag,
    ];

    const { listTagsService, mutateTagService } =
      createMockServices(existingTags);
    const { getOrCreate } = await createTagResolver(
      collectiviteId,
      listTagsService,
      mutateTagService,
      TagEnum.Financeur,
      undefined,
      mockUser
    );

    const result = await getOrCreate('Nouvelle Entité');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          nom: 'Nouvelle Entité',
          collectiviteId,
        })
      );
      expect(mutateTagService.createTag).toHaveBeenCalledWith(
        {
          nom: 'Nouvelle Entité',
          collectiviteId,
          tagType: TagEnum.Financeur,
        },
        { tx: mockTransaction, user: mockUser, isUserTrusted: true }
      );
    }
  });

  it('should handle different tag types', async () => {
    const tagTypes = [
      TagEnum.Financeur,
      TagEnum.Structure,
      TagEnum.Service,
      TagEnum.Partenaire,
    ];

    for (const tagType of tagTypes) {
      const { listTagsService, mutateTagService } = createMockServices([]);
      const { getOrCreate } = await createTagResolver(
        collectiviteId,
        listTagsService,
        mutateTagService,
        tagType,
        undefined,
        mockUser
      );

      const result = await getOrCreate('Test Entity');

      expect(result.success).toBe(true);
      expect(mutateTagService.createTag).toHaveBeenCalledWith(
        {
          nom: 'Test Entity',
          collectiviteId,
          tagType,
        },
        { tx: mockTransaction, user: mockUser, isUserTrusted: true }
      );
    }
  });

  it('should return failure when tag creation fails', async () => {
    const listTagsService = {
      listTags: vi.fn().mockResolvedValue(success([])),
    } as unknown as ListTagsService;

    const mutateTagService = {
      createTag: vi.fn().mockResolvedValue(failure('Database error')),
    } as unknown as MutateTagService;

    const { getOrCreate } = await createTagResolver(
      collectiviteId,
      listTagsService,
      mutateTagService,
      TagEnum.Financeur,
      undefined,
      mockUser
    );

    const result = await getOrCreate('New Tag');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Database error');
    }
  });

  it('should cache tags at creation time (not refetch on each call)', async () => {
    const existingTags: Tag[] = [
      { id: 1, nom: 'ADEME', collectiviteId } as Tag,
    ];

    const { listTagsService, mutateTagService } =
      createMockServices(existingTags);
    const { getOrCreate } = await createTagResolver(
      collectiviteId,
      listTagsService,
      mutateTagService,
      TagEnum.Financeur,
      undefined,
      mockUser
    );

    // First call
    await getOrCreate('ADEME');

    // Second call
    await getOrCreate('ADEME');

    // getTags should be called only once (during createTagResolver)
    expect(listTagsService.listTags).toHaveBeenCalledTimes(1);
  });

  it('should handle empty tag list', async () => {
    const { listTagsService, mutateTagService } = createMockServices([]);
    const { getOrCreate } = await createTagResolver(
      collectiviteId,
      listTagsService,
      mutateTagService,
      TagEnum.Financeur,
      undefined,
      mockUser
    );

    const result = await getOrCreate('First Tag');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(mutateTagService.createTag).toHaveBeenCalled();
    }
  });

  it('should handle multiple calls for different tags', async () => {
    const existingTags: Tag[] = [
      { id: 1, nom: 'ADEME', collectiviteId } as Tag,
      { id: 2, nom: 'Région', collectiviteId } as Tag,
    ];

    const newTagName = 'Nouvelle';
    const newTagId = 999;

    const listTagsService = {
      listTags: vi.fn().mockResolvedValue(success(existingTags)),
    } as unknown as ListTagsService;

    const mutateTagService = {
      createTag: vi.fn().mockResolvedValue(
        success({
          id: newTagId,
          nom: newTagName,
          collectiviteId,
        })
      ),
    } as unknown as MutateTagService;

    const { getOrCreate } = await createTagResolver(
      collectiviteId,
      listTagsService,
      mutateTagService,
      TagEnum.Financeur,
      undefined,
      mockUser
    );

    const result1 = await getOrCreate('ADEME');
    const result2 = await getOrCreate('Région');
    const result3 = await getOrCreate(newTagName);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result3.success).toBe(true);

    if (result1.success && result2.success && result3.success) {
      expect(result1.data).toEqual({ id: 1, nom: 'ADEME', collectiviteId });
      expect(result2.data).toEqual({ id: 2, nom: 'Région', collectiviteId });
      expect(result3.data).toEqual({
        id: newTagId,
        nom: newTagName,
        collectiviteId,
      });
    }

    expect(mutateTagService.createTag).toHaveBeenCalledTimes(1); // Only for 'Nouvelle'

    // Call again with the same newly created tag name - should not create again
    const result4 = await getOrCreate(newTagName);
    expect(result4.success).toBe(true);
    if (result4.success) {
      expect(result4.data.id).toBe(newTagId);
    }
    // saveTag should still be called only once
    expect(mutateTagService.createTag).toHaveBeenCalledTimes(1);
  });
});
