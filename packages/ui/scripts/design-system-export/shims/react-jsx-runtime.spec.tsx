import { cleanup, render, screen } from '@testing-library/react';
import { createContext, createElement, useContext } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Fragment, jsx, jsxs } from './react-jsx-runtime';

afterEach(cleanup);

describe('runtime JSX sur createElement', () => {
  it('produit les mêmes éléments que createElement', () => {
    expect(jsx('a', { href: '/x', children: 'Lien' }, 'k')).toEqual(
      createElement('a', { href: '/x', key: 'k' }, 'Lien')
    );
    expect(jsx('br', {})).toEqual(createElement('br', {}));
  });

  it('étale les enfants statiques de jsxs sans exiger de key', () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    render(
      jsxs('ul', {
        children: [
          jsx('li', { children: 'Un' }),
          jsx('li', { children: 'Deux' }),
        ],
      })
    );
    expect(
      screen.getAllByRole('listitem').map((item) => item.textContent)
    ).toEqual(['Un', 'Deux']);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('rend les fragments et les composants', () => {
    const Titre = ({ children }: { children: string }) =>
      jsx('h1', { children });
    render(
      jsxs(Fragment, { children: [jsx(Titre, { children: 'Plans' }), 'suite'] })
    );
    expect(screen.getByRole('heading').textContent).toBe('Plans');
  });

  it('rend un contexte comme son provider (syntaxe React 19)', () => {
    const Theme = createContext('clair');
    const Lecteur = () => jsx('p', { children: useContext(Theme) });
    render(jsx(Theme, { value: 'sombre', children: jsx(Lecteur, {}) }));
    expect(screen.getByText('sombre')).toBeTruthy();
    expect(jsx(Theme, { value: 'sombre' }).type).toBe(Theme.Provider);
  });
});
