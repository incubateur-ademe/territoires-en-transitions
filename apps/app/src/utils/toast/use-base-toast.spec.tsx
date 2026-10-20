import {
  act,
  cleanup,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBaseToast } from './use-base-toast';

afterEach(cleanup);

describe('useBaseToast', () => {
  it('garde la même fonction setToast entre deux rendus, pour ne pas réarmer les effets qui en dépendent', () => {
    const { result, rerender } = renderHook(() => useBaseToast());
    const premierRendu = result.current.setToast;

    rerender();

    expect(result.current.setToast).toBe(premierRendu);
  });

  it("garde la même fonction setToast après l'affichage d'un message", () => {
    const { result } = renderHook(() => useBaseToast());
    const avantAffichage = result.current.setToast;

    act(() => {
      result.current.setToast('error', 'La génération a échoué');
    });

    expect(result.current.setToast).toBe(avantAffichage);
  });

  it('garde la même fonction setToastWithAction entre deux rendus', () => {
    const { result, rerender } = renderHook(() => useBaseToast());
    const premierRendu = result.current.setToastWithAction;

    rerender();

    expect(result.current.setToastWithAction).toBe(premierRendu);
  });

  it("l'action du toast se déclenche au clic et referme le toast", () => {
    const onClick = vi.fn();
    const { result } = renderHook(() => useBaseToast());
    act(() => {
      result.current.setToastWithAction({
        status: 'success',
        message: 'Action retirée',
        action: { label: 'Annuler', onClick },
      });
    });
    const { rerender } = render(result.current.renderToast());

    act(() => {
      screen.getByRole('button', { name: 'Annuler' }).click();
    });
    rerender(result.current.renderToast());

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it("un toast simple affiché après un toast avec action n'hérite pas de son action", () => {
    const { result } = renderHook(() => useBaseToast());
    act(() => {
      result.current.setToastWithAction({
        status: 'success',
        message: 'Action retirée',
        action: { label: 'Annuler', onClick: vi.fn() },
      });
    });
    act(() => {
      result.current.setToast('success', 'Enregistré');
    });

    render(result.current.renderToast());

    expect(screen.queryByRole('button', { name: 'Annuler' })).toBeNull();
  });
});
