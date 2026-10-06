import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { planNodeFactory } from '../../../utils';
import { AxeHeader } from './axe-header';

const { updateAxe, TestAxeContext } = await vi.hoisted(async () => {
  const { createContext } = await import('react');
  return {
    updateAxe: vi.fn(),
    TestAxeContext: createContext<unknown>(undefined),
  };
});

vi.mock(
  './axe.context',
  async (): Promise<
    Partial<Record<keyof typeof import('./axe.context'), unknown>>
  > => {
    const { useContext } = await import('react');
    return {
      useAxeContext: () => useContext(TestAxeContext),
    };
  }
);

vi.mock(
  './axe-menu.button',
  (): Partial<Record<keyof typeof import('./axe-menu.button'), unknown>> => ({
    AxeMenuButton: () => null,
  })
);

const axeSansNom = planNodeFactory({ axes: [], nom: '', parentDepth: 1 });

const AxeHeaderEnEditionDuTitre = () => {
  const [isOpenEditTitle, setIsOpenEditTitle] = useState(true);
  return (
    <TestAxeContext.Provider
      value={{
        updateAxe: { mutate: updateAxe, mutateAsync: updateAxe },
        createFicheResume: { mutateAsync: vi.fn() },
        isMainAxe: true,
        isReadOnly: false,
        isOpen: false,
        setIsOpen: vi.fn(),
        isOpenEditTitle,
        setIsOpenEditTitle,
        planOptions: { isOptionEnabled: () => true },
        providerProps: { axe: axeSansNom },
      }}
    >
      <AxeHeader />
    </TestAxeContext.Provider>
  );
};

describe('AxeHeader', () => {
  beforeEach(() => {
    updateAxe.mockReset();
  });

  test("le champ du titre n'est pas imbriqué dans un bouton, où Firefox n'émet aucun événement de saisie", () => {
    render(<AxeHeaderEnEditionDuTitre />);

    expect(screen.getByRole('textbox').closest('button')).toBeNull();
  });

  test("un blur reçu après la validation par Entrée, comme sous Firefox, n'enregistre pas « Sans titre » à la place du titre saisi", () => {
    render(<AxeHeaderEnEditionDuTitre />);
    const titre = screen.getByRole('textbox');

    fireEvent.change(titre, { target: { value: 'Axe 1' } });
    fireEvent.keyDown(titre, { code: 'Enter' });
    fireEvent.blur(titre);

    expect(updateAxe.mock.calls).toEqual([[{ nom: 'Axe 1' }]]);
  });

  test("annuler par Échap puis recevoir un blur n'enregistre rien", () => {
    render(<AxeHeaderEnEditionDuTitre />);
    const titre = screen.getByRole('textbox');

    fireEvent.change(titre, { target: { value: 'Axe 1' } });
    fireEvent.keyDown(titre, { code: 'Escape' });
    fireEvent.blur(titre);

    expect(updateAxe.mock.calls).toEqual([]);
  });

  test('quitter le champ enregistre le titre saisi', () => {
    render(<AxeHeaderEnEditionDuTitre />);
    const titre = screen.getByRole('textbox');

    fireEvent.change(titre, { target: { value: 'Axe 1' } });
    fireEvent.blur(titre);

    expect(updateAxe.mock.calls).toEqual([[{ nom: 'Axe 1' }]]);
  });
});
