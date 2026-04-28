import { SearchRequestSchema } from './search-request.schema';

describe('SearchRequestSchema', () => {
  it('parses a fully-specified valid request payload', () => {
    const result = SearchRequestSchema.safeParse({
      query: 'mobilité douce',
      collectiviteId: 42,
      enabledIndexes: ['plans', 'fiches', 'actions'],
      exclusiveMode: true,
      ficheParentFilter: 'top-level',
      planParentFilter: 'root',
      limit: 30,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toBe('mobilité douce');
      expect(result.data.exclusiveMode).toBe(true);
      expect(result.data.ficheParentFilter).toBe('top-level');
      expect(result.data.planParentFilter).toBe('root');
    }
  });

  it('applies defaults when optional fields are omitted', () => {
    const result = SearchRequestSchema.safeParse({
      query: 'eau',
      collectiviteId: 1,
      enabledIndexes: ['indicateurs'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.exclusiveMode).toBe(false);
      expect(result.data.ficheParentFilter).toBe('all');
      expect(result.data.planParentFilter).toBe('all');
      expect(result.data.limit).toBe(20);
    }
  });

  it('rejects an unknown planParentFilter value', () => {
    const result = SearchRequestSchema.safeParse({
      query: 'eau',
      collectiviteId: 1,
      enabledIndexes: ['plans'],
      planParentFilter: 'top-level', // valid for fiches, NOT for plans
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty query (min(1))', () => {
    const result = SearchRequestSchema.safeParse({
      query: '',
      collectiviteId: 1,
      enabledIndexes: ['plans'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a query of 201 chars (max(200))', () => {
    const result = SearchRequestSchema.safeParse({
      query: 'a'.repeat(201),
      collectiviteId: 1,
      enabledIndexes: ['plans'],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a query of exactly 200 chars (boundary)', () => {
    const result = SearchRequestSchema.safeParse({
      query: 'a'.repeat(200),
      collectiviteId: 1,
      enabledIndexes: ['plans'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty enabledIndexes array (min(1))', () => {
    const result = SearchRequestSchema.safeParse({
      query: 'eau',
      collectiviteId: 1,
      enabledIndexes: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown index name', () => {
    const result = SearchRequestSchema.safeParse({
      query: 'eau',
      collectiviteId: 1,
      enabledIndexes: ['plans', 'unknown'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-positive collectiviteId', () => {
    const result = SearchRequestSchema.safeParse({
      query: 'eau',
      collectiviteId: 0,
      enabledIndexes: ['plans'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a limit above 50', () => {
    const result = SearchRequestSchema.safeParse({
      query: 'eau',
      collectiviteId: 1,
      enabledIndexes: ['plans'],
      limit: 51,
    });
    expect(result.success).toBe(false);
  });
});
