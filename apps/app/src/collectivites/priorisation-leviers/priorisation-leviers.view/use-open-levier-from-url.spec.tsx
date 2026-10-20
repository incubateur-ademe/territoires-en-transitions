import { renderHook, waitFor } from '@testing-library/react';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, it, vi } from 'vitest';
import { useOpenLevierFromUrl } from './use-open-levier-from-url';

const renderOpenLevierFromUrl = ({
  searchParams,
  isReady,
}: {
  searchParams: string;
  isReady: boolean;
}) => {
  const onLevierRequested = vi.fn();
  const onUrlUpdate = vi.fn();
  const { result } = renderHook(
    () => useOpenLevierFromUrl({ isReady, onLevierRequested }),
    { wrapper: withNuqsTestingAdapter({ searchParams, onUrlUpdate }) }
  );
  return { result, onLevierRequested, onUrlUpdate };
};

describe('useOpenLevierFromUrl', () => {
  it('ouvre le levier demandé par le paramètre levier, une fois les leviers chargés', () => {
    const { onLevierRequested } = renderOpenLevierFromUrl({
      searchParams: '?levier=covoiturage',
      isReady: true,
    });

    expect(onLevierRequested).toHaveBeenCalledExactlyOnceWith('covoiturage');
  });

  it("efface le paramètre levier de l'URL après l'ouverture", async () => {
    const { onUrlUpdate } = renderOpenLevierFromUrl({
      searchParams: '?levier=covoiturage',
      isReady: true,
    });

    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalledOnce());

    expect(onUrlUpdate.mock.calls[0][0].searchParams.has('levier')).toBe(false);
  });

  it("n'ouvre rien tant que les leviers ne sont pas chargés", () => {
    const { onLevierRequested } = renderOpenLevierFromUrl({
      searchParams: '?levier=covoiturage',
      isReady: false,
    });

    expect(onLevierRequested).not.toHaveBeenCalled();
  });

  it("ignore un levier inconnu et n'en demande aucun", () => {
    const { result, onLevierRequested } = renderOpenLevierFromUrl({
      searchParams: '?levier=inconnu',
      isReady: true,
    });

    expect(onLevierRequested).not.toHaveBeenCalled();
    expect(result.current.isLevierRequestedByUrl).toBe(false);
  });

  it("signale qu'un levier est demandé par l'URL, même après l'effacement du paramètre", () => {
    const { result } = renderOpenLevierFromUrl({
      searchParams: '?levier=covoiturage',
      isReady: true,
    });

    expect(result.current.isLevierRequestedByUrl).toBe(true);
  });

  it("ne signale rien quand l'URL ne demande aucun levier", () => {
    const { result } = renderOpenLevierFromUrl({
      searchParams: '',
      isReady: true,
    });

    expect(result.current.isLevierRequestedByUrl).toBe(false);
  });
});
