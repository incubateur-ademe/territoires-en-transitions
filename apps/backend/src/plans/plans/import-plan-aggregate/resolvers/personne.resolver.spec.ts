import { ListMembresService } from '@tet/backend/collectivites/membres/list-membres/list-membres.service';
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
import { createPersonneResolver } from './personne.resolver';

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
        const results = this.items.filter((item) => {
          const nom = item.nom?.toLowerCase() || '';
          const prenom = item.prenom?.toLowerCase() || '';
          const patternLower = pattern.toLowerCase();

          // Check if pattern matches nom or prenom
          if (nom.includes(patternLower) || patternLower.includes(nom)) {
            return true;
          }
          if (
            prenom &&
            (prenom.includes(patternLower) || patternLower.includes(prenom))
          ) {
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

describe('createPersonneResolver', () => {
  const collectiviteId = 42;
  const mockTransaction = {} as Transaction;

  const createMockServices = (
    existingMembers: Array<{
      userId: string;
      nom: string;
      prenom?: string;
    }> = [],
    existingTags: Tag[] = []
  ) => {
    return {
      listMembresService: {
        list: vi.fn().mockResolvedValue({ membres: existingMembers }),
      } as unknown as ListMembresService,
      listTagsService: {
        listTags: vi.fn().mockResolvedValue(success(existingTags)),
      } as unknown as ListTagsService,
      mutateTagService: {
        createTag: vi.fn().mockImplementation((tagData) => {
          return Promise.resolve(
            success({
              id: Math.floor(Math.random() * 1000),
              nom: tagData.nom,
              collectiviteId: tagData.collectiviteId,
            })
          );
        }),
      } as unknown as MutateTagService,
    };
  };

  it('should return userId when member is found', async () => {
    const existingMembers = [
      { userId: 'user-123', nom: 'Dupont', prenom: 'Jean' },
    ];
    const { listMembresService, listTagsService, mutateTagService } =
      createMockServices(existingMembers);

    const { getOrCreatePersonne } = await createPersonneResolver(
      collectiviteId,
      listMembresService,
      listTagsService,
      mutateTagService,
      mockUser,
      mockTransaction
    );

    const result = await getOrCreatePersonne('Dupont');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ userId: 'user-123' });
    }
    expect(mutateTagService.createTag).not.toHaveBeenCalled();
  });

  it('should return tagId when tag is found', async () => {
    const existingTags: Tag[] = [
      { id: 1, nom: 'Personne Tag', collectiviteId } as Tag,
    ];
    const { listMembresService, listTagsService, mutateTagService } =
      createMockServices([], existingTags);

    const { getOrCreatePersonne } = await createPersonneResolver(
      collectiviteId,
      listMembresService,
      listTagsService,
      mutateTagService,
      mockUser,
      mockTransaction
    );

    const result = await getOrCreatePersonne('Personne Tag');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ tagId: 1 });
    }
    expect(mutateTagService.createTag).not.toHaveBeenCalled();
  });

  it('should create new tag when neither member nor tag is found', async () => {
    const newTagName = 'Nouvelle Personne';
    const newTagId = 999;

    const { listMembresService, listTagsService, mutateTagService } =
      createMockServices([], []);
    (mutateTagService.createTag as ReturnType<typeof vi.fn>).mockResolvedValue(
      success({
        id: newTagId,
        nom: newTagName,
        collectiviteId,
      })
    );

    const { getOrCreatePersonne } = await createPersonneResolver(
      collectiviteId,
      listMembresService,
      listTagsService,
      mutateTagService,
      mockUser,
      mockTransaction
    );

    const result = await getOrCreatePersonne(newTagName);

    expect(result.success).toBe(true);
    expect(mutateTagService.createTag).toHaveBeenCalledTimes(1);
    expect(mutateTagService.createTag).toHaveBeenCalledWith(
      { tagType: TagEnum.Personne, nom: newTagName, collectiviteId },
      { user: mockUser, isUserTrusted: true, tx: mockTransaction }
    );
    if (result.success) {
      expect(result.data).toEqual({ tagId: newTagId });
    }
  });

  it('should not recreate tag when called again with same name after creation', async () => {
    const newTagName = 'Nouvelle Personne';
    const newTagId = 999;

    const { listMembresService, listTagsService, mutateTagService } =
      createMockServices([], []);
    (mutateTagService.createTag as ReturnType<typeof vi.fn>).mockResolvedValue(
      success({
        id: newTagId,
        nom: newTagName,
        collectiviteId,
      })
    );

    const { getOrCreatePersonne } = await createPersonneResolver(
      collectiviteId,
      listMembresService,
      listTagsService,
      mutateTagService,
      mockUser,
      mockTransaction
    );

    // First call: create the new tag
    const result1 = await getOrCreatePersonne(newTagName);

    expect(result1.success).toBe(true);
    expect(mutateTagService.createTag).toHaveBeenCalledTimes(1);

    // Second call: should find the tag in cache instead of creating it again
    const result2 = await getOrCreatePersonne(newTagName);

    expect(result2.success).toBe(true);
    // saveTag should still be called only once (not again)
    expect(mutateTagService.createTag).toHaveBeenCalledTimes(1);
    if (result1.success && result2.success) {
      expect(result1.data.tagId).toBe(newTagId);
      expect(result2.data.tagId).toBe(newTagId);
    }
  });

  it('should return failure when tag creation fails', async () => {
    const { listMembresService, listTagsService, mutateTagService } =
      createMockServices([], []);
    (mutateTagService.createTag as ReturnType<typeof vi.fn>).mockResolvedValue(
      failure('Database error')
    );

    const { getOrCreatePersonne } = await createPersonneResolver(
      collectiviteId,
      listMembresService,
      listTagsService,
      mutateTagService,
      mockUser,
      mockTransaction
    );

    const result = await getOrCreatePersonne('New Person');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Database error');
    }
  });
});
