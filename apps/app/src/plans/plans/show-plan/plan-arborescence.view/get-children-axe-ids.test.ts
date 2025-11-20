import { PlanNode } from '@tet/domain/plans';
import { getChildrenAxeIds } from './get-children-axe-ids';

describe('getAllChildrenAxeIds', () => {
  // Helper function to create test axes
  const createAxe = (
    id: number,
    parent: number | null = null,
    fiches: number[] = []
  ): PlanNode => ({
    id,
    nom: `Axe ${id}`,
    fiches,
    parent,
    depth: 0,
    collectiviteId: 1,
  });

  describe('simple cases', () => {
    it('should return empty array for axe with no children', () => {
      const axe = createAxe(1);
      const axes = [axe];

      const result = getChildrenAxeIds(axe, axes);

      expect(result).toEqual([]);
    });

    it('should return direct children IDs for axe with immediate children', () => {
      const parentAxe = createAxe(1);
      const child1 = createAxe(2, 1);
      const child2 = createAxe(3, 1);
      const axes = [parentAxe, child1, child2];

      const result = getChildrenAxeIds(parentAxe, axes);

      expect(result).toEqual([2, 3]);
    });
  });

  describe('nested hierarchy', () => {
    it('should return all nested children IDs recursively', () => {
      // Structure: 1 -> 2 -> 4, 1 -> 3 -> 5
      const axe1 = createAxe(1);
      const axe2 = createAxe(2, 1);
      const axe3 = createAxe(3, 1);
      const axe4 = createAxe(4, 2);
      const axe5 = createAxe(5, 3);
      const axes = [axe1, axe2, axe3, axe4, axe5];

      const result = getChildrenAxeIds(axe1, axes);

      expect(result).toEqual([2, 3, 4, 5]);
    });

    it('should handle deep nesting (3 levels)', () => {
      // Structure: 1 -> 2 -> 4 -> 6, 1 -> 3 -> 5
      const axe1 = createAxe(1);
      const axe2 = createAxe(2, 1);
      const axe3 = createAxe(3, 1);
      const axe4 = createAxe(4, 2);
      const axe5 = createAxe(5, 3);
      const axe6 = createAxe(6, 4);
      const axes = [axe1, axe2, axe3, axe4, axe5, axe6];

      const result = getChildrenAxeIds(axe1, axes);

      expect(result).toHaveLength(5);
      expect(result).toEqual(expect.arrayContaining([2, 3, 4, 5, 6]));
    });

    it('should handle complex branching structure', () => {
      // Structure: 1 -> 2 -> 4, 1 -> 2 -> 5, 1 -> 3 -> 6, 1 -> 3 -> 7
      const axe1 = createAxe(1);
      const axe2 = createAxe(2, 1);
      const axe3 = createAxe(3, 1);
      const axe4 = createAxe(4, 2);
      const axe5 = createAxe(5, 2);
      const axe6 = createAxe(6, 3);
      const axe7 = createAxe(7, 3);
      const axes = [axe1, axe2, axe3, axe4, axe5, axe6, axe7];

      const result = getChildrenAxeIds(axe1, axes);

      expect(result).toHaveLength(6);
      expect(result).toEqual(expect.arrayContaining([2, 3, 4, 5, 6, 7]));
    });
  });

  describe('partial tree traversal', () => {
    it('should return children of a middle-level axe', () => {
      // Structure: 1 -> 2 -> 4 -> 6, 1 -> 3 -> 5
      const axe1 = createAxe(1);
      const axe2 = createAxe(2, 1);
      const axe3 = createAxe(3, 1);
      const axe4 = createAxe(4, 2);
      const axe5 = createAxe(5, 3);
      const axe6 = createAxe(6, 4);
      const axes = [axe1, axe2, axe3, axe4, axe5, axe6];

      const result = getChildrenAxeIds(axe2, axes);

      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining([4, 6]));
    });

    it('should return children of a leaf axe (no children)', () => {
      const axe1 = createAxe(1);
      const axe2 = createAxe(2, 1);
      const axe3 = createAxe(3, 1);
      const axes = [axe1, axe2, axe3];

      const result = getChildrenAxeIds(axe2, axes);

      expect(result).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle axe not found in axes array', () => {
      const axe = createAxe(1);
      const axes: PlanNode[] = [];

      const result = getChildrenAxeIds(axe, axes);

      expect(result).toEqual([]);
    });

    it('should handle empty axes array', () => {
      const axe = createAxe(1);
      const axes: PlanNode[] = [];

      const result = getChildrenAxeIds(axe, axes);

      expect(result).toEqual([]);
    });

    it('should handle axes with null parent values', () => {
      const axe1 = createAxe(1, null);
      const axe2 = createAxe(2, 1);
      const axe3 = createAxe(3, null); // Unrelated axe
      const axes = [axe1, axe2, axe3];

      const result = getChildrenAxeIds(axe1, axes);

      expect(result).toHaveLength(1);
      expect(result).toEqual(expect.arrayContaining([2]));
    });

    it('should handle axes with fiches', () => {
      const axe1 = createAxe(1, null, [1, 2]);
      const axe2 = createAxe(2, 1, [3]);
      const axe3 = createAxe(3, 1, []);
      const axes = [axe1, axe2, axe3];

      const result = getChildrenAxeIds(axe1, axes);

      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining([2, 3]));
    });
  });

  describe('real-world scenarios', () => {
    it('should handle a typical plan structure', () => {
      // Simulating a real plan structure
      const plan = createAxe(1, null); // Root plan
      const axe1 = createAxe(2, 1); // Main axe 1
      const axe2 = createAxe(3, 1); // Main axe 2
      const subAxe1 = createAxe(4, 2); // Sub-axe of axe 1
      const subAxe2 = createAxe(5, 2); // Sub-axe of axe 1
      const subSubAxe = createAxe(6, 4); // Sub-sub-axe
      const axes = [plan, axe1, axe2, subAxe1, subAxe2, subSubAxe];

      const result = getChildrenAxeIds(plan, axes);

      expect(result).toHaveLength(5);
      expect(result).toEqual(expect.arrayContaining([2, 3, 4, 5, 6]));
    });

    it('should handle disconnected axes (orphaned nodes)', () => {
      const axe1 = createAxe(1, null);
      const axe2 = createAxe(2, 1);
      const orphanedAxe = createAxe(3, 999); // Parent doesn't exist
      const axes = [axe1, axe2, orphanedAxe];

      const result = getChildrenAxeIds(axe1, axes);

      expect(result).toHaveLength(1);
      expect(result).toEqual(expect.arrayContaining([2]));
    });
  });

  describe('performance considerations', () => {
    it('should handle large hierarchies efficiently', () => {
      // Create a large tree: 1 -> 2,3,4 -> each has 2 children -> each has 1 child
      const axes: PlanNode[] = [];

      // Root
      axes.push(createAxe(1, null));

      // Level 1 (3 children)
      for (let i = 2; i <= 4; i++) {
        axes.push(createAxe(i, 1));
      }

      // Level 2 (6 children total)
      for (let i = 5; i <= 10; i++) {
        const parent = Math.floor((i - 5) / 2) + 2;
        axes.push(createAxe(i, parent));
      }

      // Level 3 (6 children total)
      for (let i = 11; i <= 16; i++) {
        const parent = i - 6;
        axes.push(createAxe(i, parent));
      }

      const result = getChildrenAxeIds(axes[0], axes);

      expect(result).toHaveLength(15); // 3 + 6 + 6 = 15 children
      expect(result).toEqual(
        expect.arrayContaining([
          2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
        ])
      );
    });
  });
});
