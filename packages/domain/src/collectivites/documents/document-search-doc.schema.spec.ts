import { DocumentSearchDocSchema } from './document-search-doc.schema';

describe('DocumentSearchDocSchema', () => {
  it('parses a global file (collectiviteId: null)', () => {
    const result = DocumentSearchDocSchema.safeParse({
      id: 100,
      collectiviteId: null,
      filename: 'guide-national.pdf',
    });
    expect(result.success).toBe(true);
  });

  it('parses a per-collectivité file (collectiviteId: 42)', () => {
    const result = DocumentSearchDocSchema.safeParse({
      id: 101,
      collectiviteId: 42,
      filename: 'plan-vert-local.pdf',
    });
    expect(result.success).toBe(true);
  });
});
