import { appLabels } from '@/app/labels/catalog';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IndicateursListeOptions } from './indicateurs-list-options';
import { SearchParams } from './use-indicateurs-list-params';

const options: SearchParams = {
  sortBy: 'titre',
  displayGraphs: false,
  currentPage: 1,
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('indicateur search reset', () => {
  it('does not restore pending search after resetting the active criteria', async () => {
    vi.useFakeTimers();
    const setSearchParams = vi.fn();
    const renderOptions = (searchParams: SearchParams) => (
      <IndicateursListeOptions
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        countTotal={1}
        settingsOpenState={{ isOpen: false, setIsOpen: vi.fn() }}
      />
    );
    const { rerender } = render(renderOptions({ ...options, text: 'Énergie' }));
    const input = screen.getByRole('searchbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Mobilité' } });
    rerender(renderOptions(options));
    expect(input.value).toBe('');
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(setSearchParams).not.toHaveBeenCalled();
  });
  it('commits the latest text before opening filters or saving a vue', () => {
    vi.useFakeTimers();
    const setSearchParams = vi.fn();
    render(
      <IndicateursListeOptions
        searchParams={options}
        setSearchParams={setSearchParams}
        countTotal={1}
        settingsOpenState={{ isOpen: false, setIsOpen: vi.fn() }}
      />
    );
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'Mobilité' } });
    expect(setSearchParams).not.toHaveBeenCalled();
    fireEvent.blur(input, { relatedTarget: document.createElement('button') });
    expect(setSearchParams).toHaveBeenCalledExactlyOnceWith({
      ...options,
      text: 'Mobilité',
    });
  });
  it('discards pending search on navigation without writing to the destination URL', async () => {
    vi.useFakeTimers();
    const setSearchParams = vi.fn();
    render(
      <IndicateursListeOptions
        searchParams={{ ...options, text: 'Énergie' }}
        setSearchParams={setSearchParams}
        countTotal={1}
        settingsOpenState={{ isOpen: false, setIsOpen: vi.fn() }}
      />
    );
    const input = screen.getByRole('searchbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Mobilité' } });
    const destination = document.createElement('a');
    destination.href = '/autre-vue';
    fireEvent.blur(input, { relatedTarget: destination });
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(input.value).toBe('Énergie');
    expect(setSearchParams).not.toHaveBeenCalled();
  });

  it('renders vue actions between search and filters', () => {
    render(
      <IndicateursListeOptions
        searchParams={options}
        setSearchParams={vi.fn()}
        countTotal={1}
        settingsOpenState={{ isOpen: false, setIsOpen: vi.fn() }}
        actions={<button>{appLabels.indicateurVueSave}</button>}
        renderSettings={() => <button>{appLabels.filtrer}</button>}
      />
    );

    const input = screen.getByRole('searchbox');
    const saveButton = screen.getByRole('button', {
      name: 'Sauvegarder cette vue',
    });
    const filterButton = screen.getByRole('button', { name: 'Filtrer' });
    expect(
      input.compareDocumentPosition(saveButton) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      saveButton.compareDocumentPosition(filterButton) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('saves the latest search when clicking a toolbar action before debounce', () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const OptionsWithState = () => {
      const [searchParams, setSearchParams] = useState<SearchParams>({
        ...options,
        text: 'Énergie',
      });
      return (
        <IndicateursListeOptions
          searchParams={searchParams}
          setSearchParams={setSearchParams}
          countTotal={1}
          settingsOpenState={{ isOpen: false, setIsOpen: vi.fn() }}
          actions={
            <button onClick={() => save(searchParams.text)}>
              {appLabels.indicateurVueSave}
            </button>
          }
        />
      );
    };
    render(<OptionsWithState />);
    const input = screen.getByRole('searchbox');
    const saveButton = screen.getByRole('button', {
      name: 'Sauvegarder cette vue',
    });

    fireEvent.change(input, { target: { value: 'Mobilité' } });
    fireEvent.blur(input, { relatedTarget: saveButton });
    fireEvent.click(saveButton);

    expect(save).toHaveBeenCalledExactlyOnceWith('Mobilité');
  });
});
