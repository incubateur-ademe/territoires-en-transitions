import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DateRangeInlineEditor } from './date-range.inline-editor';

describe('DateRangeInlineEditor', () => {
  it('sauvegarde les brouillons au démontage', () => {
    const onSave = vi.fn();
    const { container, unmount } = render(
      <DateRangeInlineEditor
        dateDebut="2024-01-01"
        dateFin="2024-06-01"
        onSave={onSave}
        dataTestPrefix="test-date"
      />
    );

    const debutInput = container.querySelector(
      '[data-test="test-date-debut"]'
    ) as HTMLInputElement;
    fireEvent.change(debutInput, {
      target: { value: '2024-02-01' },
    });

    unmount();

    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith({
      dateDebut: '2024-02-01',
      dateFin: '2024-06-01',
    });
  });

  it('ne sauvegarde pas lors d’un changement de props sans démontage', () => {
    const onSave = vi.fn();
    const { container, rerender } = render(
      <DateRangeInlineEditor
        dateDebut="2024-01-01"
        dateFin="2024-06-01"
        onSave={onSave}
        dataTestPrefix="test-date"
      />
    );

    const debutInput = container.querySelector(
      '[data-test="test-date-debut"]'
    ) as HTMLInputElement;
    fireEvent.change(debutInput, {
      target: { value: '2024-02-01' },
    });

    rerender(
      <DateRangeInlineEditor
        dateDebut="2024-03-01"
        dateFin="2024-06-01"
        onSave={vi.fn()}
        dataTestPrefix="test-date"
      />
    );

    expect(onSave).not.toHaveBeenCalled();
  });

  it('ignore la date de fin quand dateFinDisabled est actif', () => {
    const onSave = vi.fn();
    const { container, unmount } = render(
      <DateRangeInlineEditor
        dateDebut="2024-01-01"
        dateFin="2024-06-01"
        onSave={onSave}
        dateFinDisabled
        dataTestPrefix="test-date"
      />
    );

    const debutInput = container.querySelector(
      '[data-test="test-date-debut"]'
    ) as HTMLInputElement;
    const finInput = container.querySelector(
      '[data-test="test-date-fin"]'
    ) as HTMLInputElement;
    expect(finInput.disabled).toBe(true);

    fireEvent.change(debutInput, {
      target: { value: '2024-02-01' },
    });

    unmount();

    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith({
      dateDebut: '2024-02-01',
      dateFin: '2024-06-01',
    });
  });
});
