import { CollectiviteMembresService } from '@tet/backend/collectivites/membres/membres.service';
import { TagService } from '@tet/backend/collectivites/tags/tag.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { Tag, TagEnum } from '@tet/domain/collectivites';
import { describe, expect, it, vi } from 'vitest';
import { createPersonneResolver } from './personne.resolver';

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
      memberService: {
        list: vi.fn().mockResolvedValue(existingMembers),
      } as unknown as CollectiviteMembresService,
      tagService: {
        getTags: vi.fn().mockResolvedValue(existingTags),
        saveTag: vi.fn().mockImplementation((tagData) => {
          return Promise.resolve(
            success({
              id: Math.floor(Math.random() * 1000),
              nom: tagData.nom,
              collectiviteId: tagData.collectiviteId,
            })
          );
        }),
      } as unknown as TagService,
    };
  };

  it('should return userId when member is found', async () => {
    const existingMembers = [
      { userId: 'user-123', nom: 'Dupont', prenom: 'Jean' },
    ];
    const { memberService, tagService } = createMockServices(existingMembers);

    const { getOrCreatePersonne } = await createPersonneResolver(
      collectiviteId,
      memberService,
      tagService
    );

    const result = await getOrCreatePersonne('Dupont', mockTransaction);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ userId: 'user-123' });
    }
    expect(tagService.saveTag).not.toHaveBeenCalled();
  });

  it('should return tagId when tag is found', async () => {
    const existingTags: Tag[] = [
      { id: 1, nom: 'Personne Tag', collectiviteId } as Tag,
    ];
    const { memberService, tagService } = createMockServices([], existingTags);

    const { getOrCreatePersonne } = await createPersonneResolver(
      collectiviteId,
      memberService,
      tagService
    );

    const result = await getOrCreatePersonne('Personne Tag', mockTransaction);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ tagId: 1 });
    }
    expect(tagService.saveTag).not.toHaveBeenCalled();
  });

  it('should create new tag when neither member nor tag is found', async () => {
    const newTagName = 'Nouvelle Personne';
    const newTagId = 999;

    const { memberService, tagService } = createMockServices([], []);
    (tagService.saveTag as ReturnType<typeof vi.fn>).mockResolvedValue(
      success({
        id: newTagId,
        nom: newTagName,
        collectiviteId,
      })
    );

    const { getOrCreatePersonne } = await createPersonneResolver(
      collectiviteId,
      memberService,
      tagService
    );

    const result = await getOrCreatePersonne(newTagName, mockTransaction);

    expect(result.success).toBe(true);
    expect(tagService.saveTag).toHaveBeenCalledTimes(1);
    expect(tagService.saveTag).toHaveBeenCalledWith(
      { nom: newTagName, collectiviteId },
      TagEnum.Personne,
      mockTransaction
    );
    if (result.success) {
      expect(result.data).toEqual({ tagId: newTagId });
    }
  });

  it('should not recreate tag when called again with same name after creation', async () => {
    const newTagName = 'Nouvelle Personne';
    const newTagId = 999;

    const { memberService, tagService } = createMockServices([], []);
    (tagService.saveTag as ReturnType<typeof vi.fn>).mockResolvedValue(
      success({
        id: newTagId,
        nom: newTagName,
        collectiviteId,
      })
    );

    const { getOrCreatePersonne } = await createPersonneResolver(
      collectiviteId,
      memberService,
      tagService
    );

    // First call: create the new tag
    const result1 = await getOrCreatePersonne(newTagName, mockTransaction);

    expect(result1.success).toBe(true);
    expect(tagService.saveTag).toHaveBeenCalledTimes(1);

    // Second call: should find the tag in cache instead of creating it again
    const result2 = await getOrCreatePersonne(newTagName, mockTransaction);

    expect(result2.success).toBe(true);
    // saveTag should still be called only once (not again)
    expect(tagService.saveTag).toHaveBeenCalledTimes(1);
    if (result1.success && result2.success) {
      expect(result1.data.tagId).toBe(newTagId);
      expect(result2.data.tagId).toBe(newTagId);
    }
  });

  it('should return failure when tag creation fails', async () => {
    const { memberService, tagService } = createMockServices([], []);
    (tagService.saveTag as ReturnType<typeof vi.fn>).mockResolvedValue(
      failure('Database error')
    );

    const { getOrCreatePersonne } = await createPersonneResolver(
      collectiviteId,
      memberService,
      tagService
    );

    const result = await getOrCreatePersonne('New Person', mockTransaction);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Database error');
    }
  });
});
