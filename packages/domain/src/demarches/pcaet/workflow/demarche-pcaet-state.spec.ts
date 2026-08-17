import { describe, expect, it } from 'vitest';
import { isActiveDemarchePcaetStatus } from './demarche-pcaet-state';

describe('statuts d’une démarche en cours', () => {
  it('en cours : élaboration et transmission bloquent un nouveau dépôt', () => {
    expect(isActiveDemarchePcaetStatus('en_elaboration')).toBe(true);
    expect(isActiveDemarchePcaetStatus('transmis_pour_avis')).toBe(true);
    expect(isActiveDemarchePcaetStatus('adopte')).toBe(false);
    expect(isActiveDemarchePcaetStatus('archive')).toBe(false);
  });
});
