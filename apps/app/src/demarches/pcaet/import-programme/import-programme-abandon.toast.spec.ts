import { appLabels } from '@/app/labels/catalog';
import { describe, expect, it, vi } from 'vitest';
import { makeAbandonToast } from './import-programme-abandon.toast';

describe('makeAbandonToast', () => {
  it('dit le problème et mène au compte rendu de l’import', () => {
    const onShowReport = vi.fn();

    const toast = makeAbandonToast({ motif: 'plusieurs-plans' }, onShowReport);

    expect(toast.message).toContain(appLabels.importPlanIaAbandonTitre);
    expect(toast.message).toContain(
      appLabels.importPlanIaAbandonProbleme['plusieurs-plans']
    );
    expect(toast.action.label).toBe(appLabels.importPlanIaAbandonVoirPourquoi);
    toast.action.onClick();
    expect(onShowReport).toHaveBeenCalledTimes(1);
  });
});
