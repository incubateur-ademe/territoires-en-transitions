import { describe, expect, it } from 'vitest';
import { canModifyLabellisationPreuves } from './can-modify-labellisation-preuves.rule';

describe('canModifyLabellisationPreuves', () => {
  it("autorise quand il n'y a pas d'audit", () => {
    expect(canModifyLabellisationPreuves({ audit: null })).toBe(true);
  });

  it("autorise tant que l'audit n'est pas validé (audit en cours)", () => {
    expect(
      canModifyLabellisationPreuves({ audit: { valide: false } })
    ).toBe(true);
  });

  it("verrouille dès que l'audit est validé (labellisation en cours)", () => {
    expect(
      canModifyLabellisationPreuves({ audit: { valide: true } })
    ).toBe(false);
  });
});
