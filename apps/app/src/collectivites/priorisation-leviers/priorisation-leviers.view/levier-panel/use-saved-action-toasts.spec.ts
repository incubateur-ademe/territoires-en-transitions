import { appLabels } from '@/app/labels/catalog';
import { aireCovoiturageAction } from '@/app/shared/actions-de-reference/actions-de-reference.fixture';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSavedActionToasts } from './use-saved-action-toasts';

const setToastWithAction = vi.fn();
const push = vi.fn();

vi.mock('@/app/utils/toast/toast-context', () => ({
  useToastContext: () => ({ setToast: vi.fn(), setToastWithAction }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@tet/api/collectivites', () => ({
  useCollectiviteId: (): number => 4322,
}));

const toPreselection = () => ({
  actions: [aireCovoiturageAction],
  add: vi.fn(),
  remove: vi.fn(),
  ignore: vi.fn(),
  restore: vi.fn(),
});

const renderSavedActionToasts = (preselection = toPreselection()) => ({
  preselection,
  controls: renderHook(() => useSavedActionToasts(preselection)).result.current,
});

beforeEach(() => {
  setToastWithAction.mockClear();
  push.mockClear();
});

describe('useSavedActionToasts', () => {
  it("sauvegarder une action l'ajoute et propose de voir les actions sauvegardées", () => {
    const { controls, preselection } = renderSavedActionToasts();

    controls.add(aireCovoiturageAction);

    expect(preselection.add).toHaveBeenCalledExactlyOnceWith(
      aireCovoiturageAction
    );
    expect(setToastWithAction).toHaveBeenCalledExactlyOnceWith({
      status: 'success',
      message: appLabels.actionSauvegardeeSucces,
      autoHideDuration: 6000,
      action: {
        label: appLabels.voirMesActionsSauvegardees,
        onClick: expect.any(Function),
      },
    });
  });

  it('le lien du toast ouvre la page des actions sauvegardées de la collectivité', () => {
    const { controls } = renderSavedActionToasts();
    controls.add(aireCovoiturageAction);

    setToastWithAction.mock.calls[0][0].action.onClick();

    expect(push).toHaveBeenCalledOnce();
    expect(push.mock.calls[0][0]).toContain('4322');
  });

  it('retirer une action la retire et « Annuler » la sauvegarde de nouveau', () => {
    const { controls, preselection } = renderSavedActionToasts();

    controls.remove(aireCovoiturageAction.id);

    expect(preselection.remove).toHaveBeenCalledExactlyOnceWith(
      aireCovoiturageAction.id
    );
    expect(setToastWithAction).toHaveBeenCalledExactlyOnceWith({
      status: 'success',
      message: appLabels.actionRetireeDesSauvegardeesSucces,
      autoHideDuration: 6000,
      action: { label: appLabels.annuler, onClick: expect.any(Function) },
    });

    setToastWithAction.mock.calls[0][0].action.onClick();

    expect(preselection.add).toHaveBeenCalledExactlyOnceWith(
      aireCovoiturageAction
    );
  });

  it("ignorer et restaurer une action n'affichent aucun toast", () => {
    const { controls, preselection } = renderSavedActionToasts();

    controls.ignore(aireCovoiturageAction.id);
    controls.restore(aireCovoiturageAction.id);

    expect(preselection.ignore).toHaveBeenCalledOnce();
    expect(preselection.restore).toHaveBeenCalledOnce();
    expect(setToastWithAction).not.toHaveBeenCalled();
  });
});
