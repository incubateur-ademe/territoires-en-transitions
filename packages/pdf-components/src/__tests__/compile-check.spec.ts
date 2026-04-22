import { describe, it, expect } from 'vitest';

describe('Component tree compile check', () => {
  it('imports FicheActionPdf without errors', async () => {
    const mod = await import('../fiche-action/FicheActionPdf');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });

  it('imports DocumentToExport without errors', async () => {
    const mod = await import('../primitives/DocumentToExport');
    expect(mod.default).toBeDefined();
  });

  it('imports all primitives without errors', async () => {
    const mod = await import('../primitives');
    expect(mod).toBeDefined();
  });
});
