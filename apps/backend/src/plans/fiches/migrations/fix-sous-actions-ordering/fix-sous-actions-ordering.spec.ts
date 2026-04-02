import { describe, expect, it } from 'vitest';
import {
  computeCreatedAt,
  computeCreatedAtForGroup,
} from './fix-sous-actions-ordering';

const BASE = new Date('2026-04-02T00:00:00Z');

describe('fix-sous-actions-ordering', () => {
  describe('computeCreatedAt', () => {
    it('ajoute N secondes au timestamp de base pour ordre=N', () => {
      expect(computeCreatedAt({ ordre: 1, baseTimestamp: BASE })).toEqual(
        new Date('2026-04-02T00:00:01Z')
      );
      expect(computeCreatedAt({ ordre: 5, baseTimestamp: BASE })).toEqual(
        new Date('2026-04-02T00:00:05Z')
      );
    });
  });

  describe('computeCreatedAtForGroup', () => {
    it('genere des timestamps ordonnes par ordre croissant', () => {
      const sousActions = [
        { sousActionId: 10, parentId: 1, ordre: 3 },
        { sousActionId: 11, parentId: 1, ordre: 1 },
        { sousActionId: 12, parentId: 1, ordre: 2 },
      ];

      const result = computeCreatedAtForGroup({
        sousActions,
        baseTimestamp: BASE,
      });

      expect(result).toEqual([
        { sousActionId: 10, createdAt: new Date('2026-04-02T00:00:03Z') },
        { sousActionId: 11, createdAt: new Date('2026-04-02T00:00:01Z') },
        { sousActionId: 12, createdAt: new Date('2026-04-02T00:00:02Z') },
      ]);

      const sorted = [...result].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );
      expect(sorted[0].sousActionId).toBe(11);
      expect(sorted[1].sousActionId).toBe(12);
      expect(sorted[2].sousActionId).toBe(10);
    });

    it('gere un groupe avec une seule sous-action', () => {
      const result = computeCreatedAtForGroup({
        sousActions: [{ sousActionId: 99, parentId: 5, ordre: 1 }],
        baseTimestamp: BASE,
      });

      expect(result).toEqual([
        { sousActionId: 99, createdAt: new Date('2026-04-02T00:00:01Z') },
      ]);
    });

    it('le tri ASC des createdAt correspond a l ordre croissant des etapes', () => {
      const sousActions = [
        { sousActionId: 20, parentId: 2, ordre: 1 },
        { sousActionId: 21, parentId: 2, ordre: 2 },
        { sousActionId: 22, parentId: 2, ordre: 3 },
        { sousActionId: 23, parentId: 2, ordre: 4 },
      ];

      const result = computeCreatedAtForGroup({
        sousActions,
        baseTimestamp: BASE,
      });

      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].createdAt.getTime()).toBeLessThan(
          result[i + 1].createdAt.getTime()
        );
      }
    });
  });
});
