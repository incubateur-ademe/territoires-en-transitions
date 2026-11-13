import '@testing-library/jest-dom/vitest';

import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { splitHighlights } from './highlighted-text';
import { SearchCombobox, type SearchComboboxProps } from './search-combobox';
import type { SearchComboboxGroup } from './search-combobox.types';

const GROUPES: SearchComboboxGroup[] = [
  {
    id: 'collectivites',
    label: 'Collectivités',
    options: [
      { id: 'c-1', label: 'Montpellier Méditerranée Métropole' },
      { id: 'c-2', label: 'CC du Pays de Lunel' },
    ],
  },
  {
    id: 'departements',
    label: 'Départements',
    options: [{ id: 'd-34', label: 'Hérault (34)' }],
  },
];

const renderCombobox = (props: Partial<SearchComboboxProps> = {}) => {
  const onSearch = vi.fn();
  const onSelectOption = vi.fn();
  const onRemoveSelection = vi.fn();
  const allProps: SearchComboboxProps = {
    value: '',
    onSearch,
    onSelectOption,
    onRemoveSelection,
    getSuggestions: () => GROUPES,
    label: 'Rechercher un PCAET',
    ...props,
  };
  const view = render(<SearchCombobox {...allProps} />);
  const input = screen.getByRole('combobox', { name: 'Rechercher un PCAET' });
  return {
    input,
    onSearch,
    onSelectOption,
    onRemoveSelection,
    rerender: (next: Partial<SearchComboboxProps>) =>
      view.rerender(<SearchCombobox {...allProps} {...next} />),
  };
};

const taper = (input: HTMLElement, value: string) => {
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value } });
};

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('SearchCombobox', () => {
  it('ne suggère rien sous deux caractères', () => {
    const { input } = renderCombobox();
    taper(input, 'm');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('suggère par groupes, et termine par la recherche du texte tel quel', () => {
    const { input } = renderCombobox();
    taper(input, 'mont');

    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByRole('group', { name: 'Départements' })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Montpellier Méditerranée Métropole',
      'CC du Pays de Lunel',
      'Hérault (34)',
      'Rechercher « mont »',
    ]);
  });

  it('choisit au clavier, et vide la recherche au profit du choix', () => {
    const { input, onSelectOption, onSearch } = renderCombobox();
    taper(input, 'mont');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'CC du Pays de Lunel' }).id
    );
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSelectOption).toHaveBeenCalledExactlyOnceWith(
      GROUPES[0].options[1],
      GROUPES[0]
    );
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('');
    expect(input).toHaveValue('');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('coche une option déjà choisie, et la retire si on la choisit de nouveau', () => {
    const onDeselectOption = vi.fn();
    const { input, onSelectOption } = renderCombobox({
      isOptionSelected: (option) => option.id === 'c-2',
      onDeselectOption,
    });
    taper(input, 'mont');

    expect(screen.getByRole('listbox')).toHaveAttribute(
      'aria-multiselectable',
      'true'
    );
    expect(
      screen.getByRole('option', { name: /CC du Pays de Lunel/ })
    ).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: /Montpellier/ })).toHaveAttribute(
      'aria-selected',
      'false'
    );

    fireEvent.click(
      screen.getByRole('option', { name: /CC du Pays de Lunel/ })
    );
    expect(onDeselectOption).toHaveBeenCalledExactlyOnceWith(
      GROUPES[0].options[1],
      GROUPES[0]
    );
    expect(onSelectOption).not.toHaveBeenCalled();
  });

  it('fait défiler la liste jusqu’à l’option active', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const { input } = renderCombobox();
    taper(input, 'mont');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    expect(scrollIntoView).toHaveBeenLastCalledWith({ block: 'nearest' });
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(
      screen.getByRole('option', { name: 'CC du Pays de Lunel' })
    );
  });

  it('cherche le texte sur Entrée quand la liste a changé sous l’option active', () => {
    const { input, onSearch, rerender } = renderCombobox({ value: 'mont' });
    taper(input, 'mont');
    fireEvent.keyDown(input, { key: 'ArrowUp' }); // la dernière option

    // La recherche change d'ailleurs, liste ouverte : l'option active disparaît.
    rerender({ value: 'lunel', getSuggestions: () => [] });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSearch).toHaveBeenLastCalledWith('lunel');
  });

  it('applique la saisie après le délai, une seule fois', () => {
    const { input, onSearch } = renderCombobox({ debounce: 300 });
    taper(input, 'mon');
    taper(input, 'mont');
    expect(onSearch).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(300));
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('mont');
  });

  it('applique la saisie aussitôt sur Entrée, sans suggestion active', () => {
    const { input, onSearch, onSelectOption } = renderCombobox();
    taper(input, 'monpel');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSearch).toHaveBeenCalledExactlyOnceWith('monpel');
    expect(onSelectOption).not.toHaveBeenCalled();
    act(() => vi.runAllTimers());
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('ferme sur Échap, puis vide le champ', () => {
    const { input, onSearch } = renderCombobox();
    taper(input, 'mont');

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).toHaveValue('mont');

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toHaveValue('');
    expect(onSearch).toHaveBeenLastCalledWith('');
  });

  it('retire la dernière étiquette par retour arrière sur un champ vide', () => {
    const { input, onRemoveSelection } = renderCombobox({
      selections: [
        { id: 'c-1', label: 'Montpellier Méditerranée Métropole' },
        { id: 'c-2', label: 'CC du Pays de Lunel' },
      ],
    });
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(onRemoveSelection).toHaveBeenCalledExactlyOnceWith('c-2');

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Retirer « Montpellier Méditerranée Métropole »',
      })
    );
    expect(onRemoveSelection).toHaveBeenLastCalledWith('c-1');
  });

  it('abandonne la saisie en attente quand la recherche change d’ailleurs', () => {
    const { input, onSearch, rerender } = renderCombobox({ value: 'lunel' });
    taper(input, 'lunelle');

    // « Réinitialiser les filtres » avant la fin du délai.
    rerender({ value: '' });
    act(() => vi.runAllTimers());

    expect(onSearch).not.toHaveBeenCalled();
    expect(input).toHaveValue('');
  });

  it('se recale sur une recherche changée d’ailleurs, pas sur la sienne', () => {
    const { input, rerender } = renderCombobox({ value: 'lunel' });
    expect(input).toHaveValue('lunel');

    // Réinitialisation des filtres.
    rerender({ value: '' });
    expect(input).toHaveValue('');

    // La saisie appliquée revient par `value` alors qu'on a continué à taper.
    taper(input, 'mont');
    act(() => vi.runAllTimers());
    taper(input, 'montp');
    rerender({ value: 'mont' });
    expect(input).toHaveValue('montp');
  });
});

describe('splitHighlights', () => {
  it('découpe le texte en passages surlignés ou non, chevauchements fusionnés', () => {
    expect(
      splitHighlights('Pays d’Héricourt', [
        [0, 2],
        [1, 4],
        [7, 11],
      ])
    ).toEqual([
      { text: 'Pays', isHighlighted: true },
      { text: ' d’', isHighlighted: false },
      { text: 'Héri', isHighlighted: true },
      { text: 'court', isHighlighted: false },
    ]);
  });
});
