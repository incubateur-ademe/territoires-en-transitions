import { canMutateReferentielData } from './can-mutate-referentiel.rules';

describe('canMutateReferentielData', () => {
  it('autorise la mutation en mode write', () => {
    expect(canMutateReferentielData('write')).toBe(true);
  });

  it('refuse la mutation en mode readonly', () => {
    expect(canMutateReferentielData('readonly')).toBe(false);
  });

  it('refuse la mutation en mode archived', () => {
    expect(canMutateReferentielData('archived')).toBe(false);
  });
});
