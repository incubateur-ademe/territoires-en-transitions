import { PlanNode } from '@/domain/plans/plans';
import { findAxeWithUniqDepth, getCanBeScrolledTo } from './use-toggle-axe';

const createAxe = (args: {
  id: number;
  depth: number;
  parent?: number;
  fiches?: number[];
}): PlanNode => ({
  id: args.id,
  nom: `Axe ${args.id}`,
  fiches: args.fiches ?? [],
  parent: args.parent || null,
  depth: args.depth,
  collectiviteId: 1,
});
describe('scroll to axe management', () => {
  describe('basic cases', () => {
    it('should return undefined for empty array', () => {
      const axes: PlanNode[] = [];
      const result = findAxeWithUniqDepth(axes);
      expect(result).toBeUndefined();
    });

    it('should return undefined when all axes have depth 0', () => {
      /*
      Hierarchy:
      Axe 1 (depth 0)
      Axe 2 (depth 0)  
      Axe 3 (depth 0)
      */
      const axes = [
        createAxe({ id: 1, depth: 0 }),
        createAxe({ id: 2, depth: 0 }),
        createAxe({ id: 3, depth: 0 }),
      ];
      const result = findAxeWithUniqDepth(axes);
      expect(result).toBeUndefined();
    });

    it('should return undefined with multiple axes with depth 1', () => {
      /*
      Hierarchy:
      Axe 1 (depth 0)
      ├── Axe 2 (depth 1)
      └── Axe 3 (depth 1)
      */
      const axes = [
        createAxe({ id: 1, depth: 0 }),
        createAxe({ id: 2, depth: 1, parent: 1 }),
        createAxe({ id: 3, depth: 1, parent: 1 }),
      ];
      const result = findAxeWithUniqDepth(axes);
      expect(result).toBeUndefined();
    });

    it('should return the deepest axe that is the only axe at its depth', () => {
      /*
      Hierarchy:
      Axe 1 (depth 0)
      ├── Axe 2 (depth 1)
      │   └── Axe 4 (depth 2)
      │       └── Axe 5 (depth 3)
      └── Axe 3 (depth 1)
          └── Axe 6 (depth 2)
              └── Axe 7 (depth 3)
                  └── Axe 8 (depth 4)
      */
      const axes = [
        createAxe({ id: 1, depth: 0 }),
        createAxe({ id: 2, depth: 1, parent: 1 }),
        createAxe({ id: 3, depth: 1, parent: 1 }),
        createAxe({ id: 4, depth: 2, parent: 2 }),
        createAxe({ id: 5, depth: 3, parent: 4 }),
        createAxe({ id: 6, depth: 2, parent: 3 }),
        createAxe({ id: 7, depth: 3, parent: 6 }),
        createAxe({ id: 8, depth: 4, parent: 7 }),
      ];
      const result = findAxeWithUniqDepth(axes);
      expect(result).toEqual(createAxe({ id: 8, depth: 4, parent: 7 }));
    });

    it('should return the axe with depth 2 when it is the only axe with that depth', () => {
      /*
      Hierarchy:
      Axe 1 (depth 0)
      ├── Axe 2 (depth 1)
          └── Axe 3 (depth 2)
              └── Axe 4 (depth 3)
      */
      const axes = [
        createAxe({ id: 1, depth: 0 }),
        createAxe({ id: 2, depth: 1, parent: 1 }),
        createAxe({ id: 3, depth: 2, parent: 2 }),
        createAxe({ id: 4, depth: 3, parent: 3 }),
      ];
      const result = findAxeWithUniqDepth(axes);
      expect(result).toEqual(createAxe({ id: 4, depth: 3, parent: 3 }));
    });
  });

  describe('getCanBeScrolledTo', () => {
    it('should return false when axe is not in open axes', () => {
      /*
      Hierarchy:
      Axe 1 (depth 0) [open]
      ├── Axe 2 (depth 1) [closed] ← Testing this axe
      │   └── Axe 3 (depth 2) [closed]
      └── Axe 4 (depth 1) [open]
      */
      const axes = [
        createAxe({ id: 1, depth: 0 }),
        createAxe({ id: 2, depth: 1, parent: 1 }),
        createAxe({ id: 3, depth: 2, parent: 2 }),
        createAxe({ id: 4, depth: 1, parent: 1 }),
      ];
      const openAxes = [1, 4];
      const result = getCanBeScrolledTo(2, axes, openAxes);
      expect(result).toBe(false);
    });

    it('should return true when axe is the only open axe', () => {
      /*
      Hierarchy:
      Axe 1 (depth 0) [closed]
      ├── Axe 2 (depth 1) [open] ← Testing this axe (only open axe)
      │   └── Axe 3 (depth 2) [closed]
      └── Axe 4 (depth 1) [closed]
      */
      const axes = [
        createAxe({ id: 1, depth: 0 }),
        createAxe({ id: 2, depth: 1, parent: 1 }),
        createAxe({ id: 3, depth: 2, parent: 2 }),
        createAxe({ id: 4, depth: 1, parent: 1 }),
      ];
      const openAxes = [2];
      const result = getCanBeScrolledTo(2, axes, openAxes);
      expect(result).toBe(true);
    });

    it('should return true when axe is the deepest open axe', () => {
      /*
      Hierarchy:
      Axe 1 (depth 0) [open]
      ├── Axe 2 (depth 1) [open]
      │   └── Axe 4 (depth 2) [open] ← Testing this axe
      └── Axe 3 (depth 1) [closed]
          └── Axe 5 (depth 2) [closed]
      */
      const axes = [
        createAxe({ id: 1, depth: 0 }),
        createAxe({ id: 2, depth: 1, parent: 1 }),
        createAxe({ id: 3, depth: 1, parent: 1 }),
        createAxe({ id: 4, depth: 2, parent: 2 }),
        createAxe({ id: 5, depth: 2, parent: 3 }),
      ];
      const openAxes = [1, 2, 4];
      const result = getCanBeScrolledTo(4, axes, openAxes);
      expect(result).toBe(true);
    });

    it('should return false since axes with similar depth are open', () => {
      /*
      Hierarchy:
      Axe 1 (depth 0) [open]
      ├── Axe 2 (depth 1) [open]
      │   └── Axe 4 (depth 2) [open] ← Testing this axe but parent with depth 1 is not uniq depth 1 to be open
      └── Axe 3 (depth 1) [open]
          └── Axe 5 (depth 2) [open]
      */
      const axes = [
        createAxe({ id: 1, depth: 0 }),
        createAxe({ id: 2, depth: 1, parent: 1 }),
        createAxe({ id: 3, depth: 1, parent: 1 }),
        createAxe({ id: 4, depth: 2, parent: 2 }),
        createAxe({ id: 5, depth: 2, parent: 3 }),
      ];
      const openAxes = [1, 2, 3, 4, 5];
      expect(getCanBeScrolledTo(1, axes, openAxes)).toBe(false);
      expect(getCanBeScrolledTo(2, axes, openAxes)).toBe(false);
      expect(getCanBeScrolledTo(3, axes, openAxes)).toBe(false);
      expect(getCanBeScrolledTo(4, axes, openAxes)).toBe(false);
      expect(getCanBeScrolledTo(5, axes, openAxes)).toBe(false);
    });
  });
});
