import { AxeSearchDocSchema } from './axe-search-doc.schema';

describe('AxeSearchDocSchema', () => {
  it('parses a top-level plan (parent: null, plan === id)', () => {
    const result = AxeSearchDocSchema.safeParse({
      id: 1,
      collectiviteId: 42,
      nom: 'Plan climat 2030',
      parent: null,
      plan: 1,
    });
    expect(result.success).toBe(true);
  });

  it('parses a sub-axe (parent: number, plan points to root)', () => {
    const result = AxeSearchDocSchema.safeParse({
      id: 2,
      collectiviteId: 42,
      nom: 'Axe 1.1 - Mobilité',
      parent: 1,
      plan: 1,
    });
    expect(result.success).toBe(true);
  });

  it('rejects when plan is missing', () => {
    const result = AxeSearchDocSchema.safeParse({
      id: 2,
      collectiviteId: 42,
      nom: 'Axe sans plan',
      parent: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects when nom is null (strict non-null override)', () => {
    const result = AxeSearchDocSchema.safeParse({
      id: 3,
      collectiviteId: 42,
      nom: null,
      parent: null,
      plan: 3,
    });
    expect(result.success).toBe(false);
  });
});
