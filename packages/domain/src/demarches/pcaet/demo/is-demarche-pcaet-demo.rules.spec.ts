import { describe, expect, it } from 'vitest';
import { isDemarchePcaetDemo } from './is-demarche-pcaet-demo.rules';

describe('mode démo du dépôt PCAET', () => {
  it('exige une collectivité de test et un super admin', () => {
    expect(
      isDemarchePcaetDemo({ collectiviteType: 'test', isSuperAdmin: true })
    ).toBe(true);
    expect(
      isDemarchePcaetDemo({ collectiviteType: 'test', isSuperAdmin: false })
    ).toBe(false);
    expect(
      isDemarchePcaetDemo({ collectiviteType: 'epci', isSuperAdmin: true })
    ).toBe(false);
    expect(
      isDemarchePcaetDemo({ collectiviteType: null, isSuperAdmin: true })
    ).toBe(false);
  });
});
