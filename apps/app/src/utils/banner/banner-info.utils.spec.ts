import { describe, expect, it } from 'vitest';
import {
  BANNER_DISMISSAL_DURATION_MS,
  deserializeBannerDismissal,
  isBannerDismissalActive,
} from './banner-info.utils';

const MODIFIED_AT = '2026-08-19T10:00:00.000Z';
const DISMISSED_AT = 1_755_600_000_000;

describe('isBannerDismissalActive', () => {
  it("n'est pas active sans fermeture enregistrée", () => {
    expect(
      isBannerDismissalActive({
        dismissal: undefined,
        modifiedAt: MODIFIED_AT,
        now: DISMISSED_AT,
      })
    ).toBe(false);
  });

  it('est active pendant les 24 heures suivant la fermeture', () => {
    expect(
      isBannerDismissalActive({
        dismissal: { modifiedAt: MODIFIED_AT, dismissedAt: DISMISSED_AT },
        modifiedAt: MODIFIED_AT,
        now: DISMISSED_AT + BANNER_DISMISSAL_DURATION_MS - 1,
      })
    ).toBe(true);
  });

  it('expire exactement 24 heures après la fermeture', () => {
    expect(
      isBannerDismissalActive({
        dismissal: { modifiedAt: MODIFIED_AT, dismissedAt: DISMISSED_AT },
        modifiedAt: MODIFIED_AT,
        now: DISMISSED_AT + BANNER_DISMISSAL_DURATION_MS,
      })
    ).toBe(false);
  });

  it("n'est pas active pour une bannière modifiée depuis la fermeture", () => {
    expect(
      isBannerDismissalActive({
        dismissal: { modifiedAt: MODIFIED_AT, dismissedAt: DISMISSED_AT },
        modifiedAt: '2026-08-19T11:00:00.000Z',
        now: DISMISSED_AT + 1,
      })
    ).toBe(false);
  });
});

describe('deserializeBannerDismissal', () => {
  it('lit une fermeture enregistrée', () => {
    expect(
      deserializeBannerDismissal(
        JSON.stringify({
          modifiedAt: MODIFIED_AT,
          dismissedAt: DISMISSED_AT,
        })
      )
    ).toEqual({ modifiedAt: MODIFIED_AT, dismissedAt: DISMISSED_AT });
  });

  it("ignore un contenu qui n'est pas du JSON", () => {
    expect(deserializeBannerDismissal('pas du json')).toBeUndefined();
  });

  it('ignore un JSON qui ne respecte pas la forme attendue', () => {
    expect(
      deserializeBannerDismissal(JSON.stringify({ modifiedAt: MODIFIED_AT }))
    ).toBeUndefined();
  });
});
