import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastFloater } from './ToastFloater';

/**
 * Le minuteur de fermeture automatique doit être lié à l'OUVERTURE du toast, pas
 * au rendu du composant : `ToastFloater` est monté en permanence (dans
 * `ToastProvider`), un toast peut donc s'ouvrir longtemps après le montage —
 * typiquement le toast « comptes associés », déclenché après la redirection du
 * callback OIDC. Un minuteur armé au montage le fermait aussitôt affiché.
 */
describe('ToastFloater', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('ferme le toast après la durée par défaut (4 s)', () => {
    const onClose = vi.fn();
    render(
      <ToastFloater open onClose={onClose}>
        {'message'}
      </ToastFloater>
    );

    vi.advanceTimersByTime(3999);
    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('respecte une durée explicite', () => {
    const onClose = vi.fn();
    render(
      <ToastFloater open onClose={onClose} autoHideDuration={6000}>
        {'message'}
      </ToastFloater>
    );

    vi.advanceTimersByTime(4001);
    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2000);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("n'arme aucun minuteur tant que le toast est fermé", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <ToastFloater open={false} onClose={onClose}>
        {'message'}
      </ToastFloater>
    );

    // Le composant reste monté bien plus longtemps que la durée d'affichage…
    vi.advanceTimersByTime(10000);
    expect(onClose).not.toHaveBeenCalled();

    // …puis le toast s'ouvre : il doit rester visible 4 s pleines.
    rerender(
      <ToastFloater open onClose={onClose}>
        {'message'}
      </ToastFloater>
    );

    vi.advanceTimersByTime(3999);
    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ne raccourcit pas l’affichage quand le composant se rend à nouveau', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <ToastFloater open onClose={onClose}>
        {'message'}
      </ToastFloater>
    );

    vi.advanceTimersByTime(3000);
    // Un nouveau rendu (parent qui se rafraîchit) ne doit ni avancer ni
    // repousser la fermeture : elle reste calée sur l'ouverture.
    rerender(
      <ToastFloater open onClose={onClose}>
        {'message'}
      </ToastFloater>
    );

    vi.advanceTimersByTime(999);
    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
