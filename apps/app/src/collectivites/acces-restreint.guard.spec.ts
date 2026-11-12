import { describe, expect, it } from 'vitest';
import { getDemarcheDuDossier } from './acces-restreint.guard';

describe('getDemarcheDuDossier', () => {
  it('reconnaît les écrans du dossier d’une démarche', () => {
    expect(getDemarcheDuDossier(['demarche-pcaet', '42'])).toBe(42);
    expect(getDemarcheDuDossier(['demarche-pcaet', '42', 'documents'])).toBe(
      42
    );
  });

  it('écarte la liste, la création, la consultation et les autres pages', () => {
    expect(getDemarcheDuDossier(['demarche-pcaet'])).toBeNull();
    expect(getDemarcheDuDossier(['demarche-pcaet', 'nouveau'])).toBeNull();
    expect(
      getDemarcheDuDossier(['demarche-pcaet', 'consultation', '42'])
    ).toBeNull();
    expect(getDemarcheDuDossier(['plans', '42'])).toBeNull();
    expect(getDemarcheDuDossier([])).toBeNull();
  });
});
