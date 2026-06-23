import { describe, expect, it } from 'vitest';
import { isActeEngagementVisible } from './is-acte-engagement-visible';

describe('isActeEngagementVisible', () => {
  it("visible pour un non-COT qui n'a pas encore d'étoile", () => {
    expect(
      isActeEngagementVisible({
        isCOT: false,
        hasAtLeastOneStar: false,
      })
    ).toBe(true);
  });

  it('masqué pour un COT', () => {
    expect(
      isActeEngagementVisible({
        isCOT: true,
        hasAtLeastOneStar: false,
      })
    ).toBe(false);
  });

  it("masqué dès qu'au moins une étoile est obtenue", () => {
    expect(
      isActeEngagementVisible({
        isCOT: false,
        hasAtLeastOneStar: true,
      })
    ).toBe(false);
  });

  it('masqué pour un COT ayant déjà une étoile', () => {
    expect(
      isActeEngagementVisible({
        isCOT: true,
        hasAtLeastOneStar: true,
      })
    ).toBe(false);
  });
});
