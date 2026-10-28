import { aireCovoiturageAction } from '@/app/shared/actions-de-reference/actions-de-reference.fixture';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PreselectionToggleButton } from './preselection-toggle.button';
import type { Preselection, PreselectionStatus } from './use-preselection';

const SAVE_BUTTON_NAME = 'Sauvegarder';
const SAVED_BUTTON_NAME = 'Sauvegardé';

const preselectionMock = vi.hoisted(() => ({
  add: vi.fn<Preselection['add']>(),
  remove: vi.fn<Preselection['remove']>(),
  statusOf: vi.fn<Preselection['statusOf']>(),
  isReady: true,
}));

vi.mock('./use-preselection', () => ({
  usePreselection: (): Partial<Preselection> => preselectionMock,
}));

beforeEach(() => {
  preselectionMock.add.mockReset();
  preselectionMock.remove.mockReset();
  preselectionMock.statusOf.mockReset();
  preselectionMock.isReady = true;
});

afterEach(cleanup);

const renderButtonWithStatus = (status: PreselectionStatus): HTMLElement => {
  preselectionMock.statusOf.mockReturnValue(status);
  render(<PreselectionToggleButton action={aireCovoiturageAction} />);
  return screen.getByRole('button');
};

describe('action-disponible', () => {
  it('propose « Sauvegarder »', () => {
    const button = renderButtonWithStatus('disponible');

    expect(button.textContent).toBe(SAVE_BUTTON_NAME);
  });

  it("ajoute l'action à la présélection au clic", () => {
    const button = renderButtonWithStatus('disponible');

    fireEvent.click(button);

    expect(preselectionMock.add).toHaveBeenCalledExactlyOnceWith(
      aireCovoiturageAction
    );
  });
});

describe('action-preselectionnee', () => {
  it('affiche « Sauvegardé »', () => {
    const button = renderButtonWithStatus('preselectionnee');

    expect(button.textContent).toBe(SAVED_BUTTON_NAME);
  });

  it("retire l'action de la présélection au clic", () => {
    const button = renderButtonWithStatus('preselectionnee');

    fireEvent.click(button);

    expect(preselectionMock.remove).toHaveBeenCalledExactlyOnceWith(
      aireCovoiturageAction.id
    );
    expect(preselectionMock.add).not.toHaveBeenCalled();
  });
});

describe('action-ignoree', () => {
  it('propose « Sauvegarder »', () => {
    const button = renderButtonWithStatus('ignoree');

    expect(button.textContent).toBe(SAVE_BUTTON_NAME);
  });

  it("ajoute l'action à la présélection au clic", () => {
    const button = renderButtonWithStatus('ignoree');

    fireEvent.click(button);

    expect(preselectionMock.add).toHaveBeenCalledExactlyOnceWith(
      aireCovoiturageAction
    );
  });
});

describe('presélection-pas-encore-lue', () => {
  it('est désactivé tant que la présélection n est pas chargée', () => {
    preselectionMock.isReady = false;
    const button = renderButtonWithStatus('disponible');

    expect(button).toHaveProperty('disabled', true);
  });
});
