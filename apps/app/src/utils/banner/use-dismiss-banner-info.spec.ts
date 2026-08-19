import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { BANNER_DISMISSAL_DURATION_MS } from './banner-info.utils';
import { useDismissBannerInfo } from './use-dismiss-banner-info';

const STORAGE_KEY = 'tet_banner_info_dismissal';
const MODIFIED_AT = '2026-08-19T10:00:00.000Z';
const NOUVEAU_MESSAGE_MODIFIED_AT = '2026-08-19T11:00:00.000Z';

function storeDismissal(dismissal: {
  modifiedAt: string;
  dismissedAt: number;
}): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissal));
}

describe('useDismissBannerInfo', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("affiche la bannière tant que rien n'a été fermé", () => {
    const { result } = renderHook(() => useDismissBannerInfo(MODIFIED_AT));

    expect(result.current.isVisible).toBe(true);
  });

  it('masque la bannière au clic sur la croix', () => {
    const { result } = renderHook(() => useDismissBannerInfo(MODIFIED_AT));

    act(() => result.current.dismiss());

    expect(result.current.isVisible).toBe(false);
  });

  it('garde la bannière masquée au rechargement dans les 24 heures', () => {
    const { result: premierChargement } = renderHook(() =>
      useDismissBannerInfo(MODIFIED_AT)
    );
    act(() => premierChargement.current.dismiss());

    const { result: rechargement } = renderHook(() =>
      useDismissBannerInfo(MODIFIED_AT)
    );

    expect(rechargement.current.isVisible).toBe(false);
  });

  it('réaffiche la bannière plus de 24 heures après la fermeture', () => {
    storeDismissal({
      modifiedAt: MODIFIED_AT,
      dismissedAt: Date.now() - BANNER_DISMISSAL_DURATION_MS - 1,
    });

    const { result } = renderHook(() => useDismissBannerInfo(MODIFIED_AT));

    expect(result.current.isVisible).toBe(true);
  });

  it('réaffiche la bannière quand un nouveau message est publié', () => {
    storeDismissal({ modifiedAt: MODIFIED_AT, dismissedAt: Date.now() });

    const { result } = renderHook(() =>
      useDismissBannerInfo(NOUVEAU_MESSAGE_MODIFIED_AT)
    );

    expect(result.current.isVisible).toBe(true);
  });

  it("réaffiche la bannière quand un nouveau message remplace celui qui vient d'être fermé", () => {
    const { result, rerender } = renderHook(
      ({ modifiedAt }) => useDismissBannerInfo(modifiedAt),
      { initialProps: { modifiedAt: MODIFIED_AT } }
    );
    act(() => result.current.dismiss());
    expect(result.current.isVisible).toBe(false);

    rerender({ modifiedAt: NOUVEAU_MESSAGE_MODIFIED_AT });

    expect(result.current.isVisible).toBe(true);
  });

  it('ignore une fermeture stockée illisible', () => {
    localStorage.setItem(STORAGE_KEY, 'pas du json');

    const { result } = renderHook(() => useDismissBannerInfo(MODIFIED_AT));

    expect(result.current.isVisible).toBe(true);
  });
});
