import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
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
});
