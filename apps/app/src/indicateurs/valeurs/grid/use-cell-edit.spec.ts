import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useCellEdit } from './use-cell-edit';

describe('useCellEdit', () => {
  it('re-enregistre le dernier draft saisi pendant une sauvegarde en vol', async () => {
    let resolveFirst: (result: boolean) => void = () => undefined;
    const onSave = vi
      .fn<(resultat: number | null) => Promise<boolean>>()
      .mockImplementationOnce(
        () =>
          new Promise<boolean>((resolve) => {
            resolveFirst = resolve;
          })
      )
      .mockResolvedValue(true);

    const { result } = renderHook(() =>
      useCellEdit({ currentValue: null, onSave })
    );

    act(() => result.current.onChange('5'));
    let firstSave: Promise<void> = Promise.resolve();
    act(() => {
      firstSave = result.current.save();
    });
    act(() => result.current.onChange('7'));
    act(() => {
      void result.current.save();
    });

    await act(async () => {
      resolveFirst(true);
      await firstSave;
    });

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    expect(onSave).toHaveBeenNthCalledWith(1, 5);
    expect(onSave).toHaveBeenNthCalledWith(2, 7);
  });

  it('ecrit le dernier draft meme si la valeur courante a change pendant la sauvegarde en vol', async () => {
    let resolveFirst: (result: boolean) => void = () => undefined;
    const onSave = vi
      .fn<(resultat: number | null) => Promise<boolean>>()
      .mockImplementationOnce(
        () =>
          new Promise<boolean>((resolve) => {
            resolveFirst = resolve;
          })
      )
      .mockResolvedValue(true);

    const { result, rerender } = renderHook(
      ({ currentValue }: { currentValue: number | null }) =>
        useCellEdit({ currentValue, onSave }),
      { initialProps: { currentValue: 10 as number | null } }
    );

    act(() => result.current.onChange('20'));
    let firstSave: Promise<void> = Promise.resolve();
    act(() => {
      firstSave = result.current.save();
    });

    rerender({ currentValue: 20 });

    act(() => result.current.onChange('10'));
    act(() => {
      void result.current.save();
    });

    await act(async () => {
      resolveFirst(true);
      await firstSave;
    });

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(10));
  });

  it("garde la valeur saisie apres sauvegarde tant que la valeur courante n'est pas rafraichie", async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const { result, rerender } = renderHook(
      ({ currentValue }: { currentValue: number | null }) =>
        useCellEdit({ currentValue, onSave }),
      { initialProps: { currentValue: 10 as number | null } }
    );

    act(() => result.current.onChange('12'));
    await act(async () => {
      await result.current.save();
    });

    expect(result.current.text).toBe('12');

    rerender({ currentValue: 12 });
    expect(result.current.text).toBe('12');

    rerender({ currentValue: 30 });
    expect(result.current.text).toBe('30');
  });

  it('vide une cellule renseignee en enregistrant null', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() =>
      useCellEdit({ currentValue: 12, onSave })
    );

    act(() => result.current.onChange(''));
    await act(async () => {
      await result.current.save();
    });

    expect(onSave).toHaveBeenCalledWith(null);
  });

  it('n’enregistre pas après annulation même si save est rappelé tout de suite', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() =>
      useCellEdit({ currentValue: 12, onSave })
    );

    act(() => result.current.onChange('42'));
    act(() => result.current.cancel());
    await act(async () => {
      await result.current.save();
    });

    expect(onSave).not.toHaveBeenCalled();
  });
});
