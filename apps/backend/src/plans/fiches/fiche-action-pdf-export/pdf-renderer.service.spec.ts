import type { FicheActionPdfExtendedProps } from '@tet/pdf-components';
import { Worker } from 'node:worker_threads';
import { afterEach, vi } from 'vitest';
import { PdfRendererService } from './pdf-renderer.service';

const fiche = {
  fiche: {
    id: 1,
    collectiviteId: 1,
    titre: 'Fiche de test',
    statut: 'En cours',
  },
  chemins: [],
  indicateursListe: [],
  fichesLiees: [],
  actionsLiees: [],
  annexes: undefined,
  notes: undefined,
  budgets: undefined,
} as unknown as FicheActionPdfExtendedProps;

describe('PdfRendererService', () => {
  const renderer = new PdfRendererService();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the PDF in a worker thread', async () => {
    const result = await renderer.render({
      fiches: [fiche],
      notesYears: 'all',
      timeoutMs: 30_000,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    }
  });

  it('returns RENDER_TIMEOUT and stops the thread when the delay expires', async () => {
    const terminate = vi.spyOn(Worker.prototype, 'terminate');

    const result = await renderer.render({
      fiches: [fiche],
      notesYears: 'all',
      timeoutMs: 1,
    });

    expect(result).toEqual({ success: false, error: 'RENDER_TIMEOUT' });
    expect(terminate).toHaveBeenCalledOnce();
  });

});
