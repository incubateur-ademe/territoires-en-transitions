import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useCellEdit } from './use-cell-edit';

const ok = true;

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
      .mockResolvedValue(ok);

    const { result } = renderHook(() =>
      useCellEdit({ currentValue: null, onSave })
    );

    act(() => result.current.onChange('5'));
    let firstSave: Promise<boolean> = Promise.resolve(true);
    act(() => {
      firstSave = result.current.save();
    });
    act(() => result.current.onChange('7'));
    act(() => {
      void result.current.save();
    });

    await act(async () => {
      resolveFirst(ok);
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
      .mockResolvedValue(ok);

    const { result, rerender } = renderHook(
      ({ currentValue }: { currentValue: number | null }) =>
        useCellEdit({ currentValue, onSave }),
      { initialProps: { currentValue: 10 as number | null } }
    );

    act(() => result.current.onChange('20'));
    let firstSave: Promise<boolean> = Promise.resolve(true);
    act(() => {
      firstSave = result.current.save();
    });

    rerender({ currentValue: 20 });

    act(() => result.current.onChange('10'));
    act(() => {
      void result.current.save();
    });

    await act(async () => {
      resolveFirst(ok);
      await firstSave;
    });

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(10));
  });

  it('re-enregistre la valeur initiale ressaisie sans attendre le rafraichissement', async () => {
    let resolveFirst: (result: boolean) => void = () => undefined;
    const onSave = vi
      .fn<(resultat: number | null) => Promise<boolean>>()
      .mockImplementationOnce(
        () =>
          new Promise<boolean>((resolve) => {
            resolveFirst = resolve;
          })
      )
      .mockResolvedValue(ok);
    const { result } = renderHook(() =>
      useCellEdit({ currentValue: 10, onSave })
    );

    act(() => result.current.onChange('20'));
    let saveResult: Promise<boolean> = Promise.resolve(true);
    act(() => {
      saveResult = result.current.save();
    });
    act(() => result.current.onChange('10'));

    await act(async () => {
      resolveFirst(ok);
      await saveResult;
    });

    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave).toHaveBeenNthCalledWith(1, 20);
    expect(onSave).toHaveBeenNthCalledWith(2, 10);
  });

  it('met en file une nouvelle édition après Escape pendant une sauvegarde', async () => {
    let resolveFirst: (result: boolean) => void = () => undefined;
    const onSave = vi
      .fn<(resultat: number | null) => Promise<boolean>>()
      .mockImplementationOnce(
        () =>
          new Promise<boolean>((resolve) => {
            resolveFirst = resolve;
          })
      )
      .mockResolvedValue(ok);
    const { result } = renderHook(() =>
      useCellEdit({ currentValue: 10, onSave })
    );

    act(() => result.current.onChange('20'));
    let firstSave: Promise<boolean> = Promise.resolve(true);
    act(() => {
      firstSave = result.current.save();
    });
    act(() => result.current.cancel());
    act(() => result.current.onChange('30'));
    let secondSave: Promise<boolean> = Promise.resolve(true);
    act(() => {
      secondSave = result.current.save();
    });

    expect(secondSave).not.toBe(firstSave);
    expect(onSave).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveFirst(ok);
      await secondSave;
    });

    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave).toHaveBeenNthCalledWith(1, 20);
    expect(onSave).toHaveBeenNthCalledWith(2, 30);
  });

  it("réécrit la valeur initiale après Escape si l'écriture précédente a abouti", async () => {
    let resolveFirst: (result: boolean) => void = () => undefined;
    const onSave = vi
      .fn<(resultat: number | null) => Promise<boolean>>()
      .mockImplementationOnce(
        () =>
          new Promise<boolean>((resolve) => {
            resolveFirst = resolve;
          })
      )
      .mockResolvedValue(ok);
    const { result } = renderHook(() =>
      useCellEdit({ currentValue: 10, onSave })
    );

    act(() => result.current.onChange('20'));
    act(() => {
      void result.current.save();
    });
    act(() => result.current.cancel());
    act(() => result.current.onChange('10'));
    let secondSave: Promise<boolean> = Promise.resolve(true);
    act(() => {
      secondSave = result.current.save();
    });

    await act(async () => {
      resolveFirst(ok);
      await secondSave;
    });

    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave).toHaveBeenNthCalledWith(1, 20);
    expect(onSave).toHaveBeenNthCalledWith(2, 10);
  });

  it('affiche la valeur normalisee meme si le rafraichissement arrive avant la fin de la mutation', async () => {
    let resolveSave: (result: boolean) => void = () => undefined;
    const onSave = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveSave = resolve;
        })
    );
    const { result, rerender } = renderHook(
      ({ currentValue }: { currentValue: number | null }) =>
        useCellEdit({ currentValue, onSave }),
      { initialProps: { currentValue: 10 as number | null } }
    );

    act(() => result.current.onChange('1,6'));
    let saveResult: Promise<boolean> = Promise.resolve(false);
    act(() => {
      saveResult = result.current.save();
    });

    // Le serveur applique ici une précision 0 et renvoie 2 lors du refetch
    // effectué par le callback onSuccess de la mutation.
    rerender({ currentValue: 2 });
    await act(async () => {
      resolveSave(ok);
      await saveResult;
    });

    expect(result.current.text).toBe('2');
    expect(result.current.status).toBe('saved');
  });

  it('vide une cellule renseignee en enregistrant null', async () => {
    const onSave = vi.fn().mockResolvedValue(ok);
    const { result } = renderHook(() =>
      useCellEdit({ currentValue: 12, onSave })
    );

    act(() => result.current.onChange(''));
    await act(async () => {
      await result.current.save();
    });

    expect(onSave).toHaveBeenCalledWith(null);
  });

  it('garde le draft et refuse la fermeture quand le serveur rejette la valeur', async () => {
    const onSave = vi.fn().mockResolvedValue(false);
    const { result } = renderHook(() =>
      useCellEdit({ currentValue: 12, onSave })
    );

    act(() => result.current.onChange('15'));
    let canClose = true;
    await act(async () => {
      canClose = await result.current.save();
    });

    expect(canClose).toBe(false);
    expect(result.current.text).toBe('15');
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('save');
  });

  it('garde un draft non numerique et refuse la fermeture sans requete', async () => {
    const onSave = vi.fn().mockResolvedValue(ok);
    const { result } = renderHook(() =>
      useCellEdit({ currentValue: 12, onSave })
    );

    act(() => result.current.onChange('-'));
    let canClose = true;
    await act(async () => {
      canClose = await result.current.save();
    });

    expect(canClose).toBe(false);
    expect(result.current.text).toBe('-');
    expect(result.current.error).toBe('invalid');
    expect(onSave).not.toHaveBeenCalled();
  });
});
