import { InstanceGouvernanceService } from '@tet/backend/collectivites/handle-instance-gouvernance/handle-instance-gouvernance.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { Tag } from '@tet/domain/collectivites';
import { describe, expect, it, vi } from 'vitest';
import { createInstanceGouvernanceResolver } from './instance-gouvernance.resolver';

// Mock Fuse
vi.mock('@tet/backend/utils/fuse/fuse.utils', () => ({
  getFuse: async () => {
    return class MockFuse {
      private items: any[];
      constructor(items: any[], private options: any) {
        this.items = items;
      }

      search(pattern: string): Array<{ item: any }> {
        // Simple mock: fuzzy match on 'nom' field
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

describe('createInstanceGouvernanceResolver', () => {
  const collectiviteId = 42;
  const mockTransaction = {} as Transaction;
  const mockUser = { id: 'user-123' } as AuthenticatedUser;

  const createMockInstanceGouvernanceService = (existingTags: Tag[] = []) => {
    return {
      list: vi.fn().mockResolvedValue(success(existingTags)),
      create: vi.fn().mockImplementation((tagData) => {
        return Promise.resolve(
          success({
            id: Math.floor(Math.random() * 1000),
            nom: tagData.nom,
            collectiviteId: tagData.collectiviteId,
          })
        );
      }),
    } as unknown as InstanceGouvernanceService;
  };

  it('should handle multiple calls for different instance governance with cache hit and creation in the same call', async () => {
    const existingTags: Tag[] = [
      { id: 1, nom: 'Comité de pilotage', collectiviteId } as Tag,
      { id: 2, nom: 'Conseil municipal', collectiviteId } as Tag,
    ];

    const newTagName = 'Nouvelle instance';
    const newTagId = 999;

    const mockService = {
      list: vi.fn().mockResolvedValue(success(existingTags)),
      create: vi.fn().mockResolvedValue(
        success({
          id: newTagId,
          nom: newTagName,
          collectiviteId,
        })
      ),
    } as unknown as InstanceGouvernanceService;

    const resolverResult = await createInstanceGouvernanceResolver(
      collectiviteId,
      mockService,
      mockUser
    );

    expect(resolverResult.success).toBe(true);
    if (resolverResult.success) {
      const { getOrCreate } = resolverResult.data;

      const result1 = await getOrCreate('Comité de pilotage', mockTransaction);
      const result2 = await getOrCreate('Conseil municipal', mockTransaction);
      const result3 = await getOrCreate(newTagName, mockTransaction);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);

      if (result1.success && result2.success && result3.success) {
        expect(result1.data).toEqual({
          id: 1,
          nom: 'Comité de pilotage',
          collectiviteId,
        });
        expect(result2.data).toEqual({
          id: 2,
          nom: 'Conseil municipal',
          collectiviteId,
        });
        expect(result3.data).toEqual({
          id: newTagId,
          nom: newTagName,
          collectiviteId,
        });
      }

      expect(mockService.create).toHaveBeenCalledTimes(1); // Only for 'Nouvelle instance'

      // Call again with the same newly created tag name - should not create again
      const result4 = await getOrCreate(newTagName, mockTransaction);
      expect(result4.success).toBe(true);
      if (result4.success) {
        expect(result4.data.id).toBe(newTagId);
      }
      // create should still be called only once
      expect(mockService.create).toHaveBeenCalledTimes(1);
    }
  });

  it('should return failure when instance governance creation fails', async () => {
    const mockService = {
      list: vi.fn().mockResolvedValue(success([])),
      create: vi.fn().mockResolvedValue(failure('Database error')),
    } as unknown as InstanceGouvernanceService;

    const resolverResult = await createInstanceGouvernanceResolver(
      collectiviteId,
      mockService,
      mockUser
    );

    expect(resolverResult.success).toBe(true);
    if (resolverResult.success) {
      const { getOrCreate } = resolverResult.data;
      const result = await getOrCreate('New Instance', mockTransaction);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Database error');
      }
    }
  });

  it('should return failure when list fails', async () => {
    const mockService = {
      list: vi.fn().mockResolvedValue(failure('Permission denied')),
      create: vi.fn(),
    } as unknown as InstanceGouvernanceService;

    const resolverResult = await createInstanceGouvernanceResolver(
      collectiviteId,
      mockService,
      mockUser
    );

    expect(resolverResult.success).toBe(false);
    if (!resolverResult.success) {
      expect(resolverResult.error).toContain('Permission denied');
    }
  });

  it('should cache instance governance at creation time (not refetch on each call)', async () => {
    const existingTags: Tag[] = [
      { id: 1, nom: 'Comité de pilotage', collectiviteId } as Tag,
    ];

    const mockService = createMockInstanceGouvernanceService(existingTags);
    const resolverResult = await createInstanceGouvernanceResolver(
      collectiviteId,
      mockService,
      mockUser
    );

    expect(resolverResult.success).toBe(true);
    if (resolverResult.success) {
      const { getOrCreate } = resolverResult.data;

      // First call - uses existing tag from initial list
      await getOrCreate('Comité de pilotage', mockTransaction);

      // Second call - should use cache (no create call)
      await getOrCreate('Comité de pilotage', mockTransaction);

      // list should be called only once (during createInstanceGouvernanceResolver)
      expect(mockService.list).toHaveBeenCalledTimes(1);
      // create should not be called for existing tags
      expect(mockService.create).toHaveBeenCalledTimes(0);
    }
  });
});
