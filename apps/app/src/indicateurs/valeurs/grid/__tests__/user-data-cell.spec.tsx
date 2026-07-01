import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UserDataCell } from '../user-data-cell';
import { toIndicateurId, toYear } from '../types';

const typeAndCommit = (input: HTMLElement, raw: string): void => {
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: raw } });
  fireEvent.keyDown(input, { key: 'Enter' });
};

const renderEmptyCell = (
  writeCell: ReturnType<typeof vi.fn>
): HTMLInputElement => {
  render(
    <UserDataCell
      cell={{ kind: 'user-data', value: null, coveringSources: [] }}
      ariaLabel="NOx 2030"
      indicateurId={toIndicateurId(12)}
      year={toYear(2030)}
      writeCell={writeCell}
    />
  );
  return screen.getByRole('textbox') as HTMLInputElement;
};

describe('UserDataCell edition', () => {
  it('commit la valeur saisie via writeCell a la validation', async () => {
    const writeCell = vi.fn().mockResolvedValue({ ok: true, value: undefined });
    const input = renderEmptyCell(writeCell);

    typeAndCommit(input, '42');

    await waitFor(() =>
      expect(writeCell).toHaveBeenCalledWith({
        indicateurId: 12,
        valueId: undefined,
        year: 2030,
        resultat: 42,
      })
    );
    await screen.findByText('Enregistré');
  });

  it('filtre les caracteres non numeriques a la saisie', () => {
    const input = renderEmptyCell(
      vi.fn().mockResolvedValue({ ok: true, value: undefined })
    );

    fireEvent.change(input, { target: { value: '1a2b' } });

    expect(input.value).toBe('12');
  });

  it('conserve la saisie et signale une erreur quand le write echoue', async () => {
    const writeCell = vi.fn().mockResolvedValue({ ok: false, error: 'boom' });
    const input = renderEmptyCell(writeCell);

    typeAndCommit(input, '7');

    await waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));
    expect(input.value).toBe('7');
    expect(screen.queryByText('Enregistré')).toBe(null);
  });

  it('reste editable et signale une erreur si le write rejette', async () => {
    const writeCell = vi.fn().mockRejectedValue(new Error('network'));
    const input = renderEmptyCell(writeCell);

    typeAndCommit(input, '42');
    await waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));

    typeAndCommit(input, '43');
    await waitFor(() => expect(writeCell).toHaveBeenCalledTimes(2));
  });

  it('signale une erreur sans ecrire quand la saisie est invalide', async () => {
    const writeCell = vi.fn().mockResolvedValue({ ok: true, value: undefined });
    render(
      <UserDataCell
        cell={{ kind: 'user-data', value: 12, valueId: 100, coveringSources: [] }}
        ariaLabel="NOx 2030"
        indicateurId={toIndicateurId(12)}
        year={toYear(2030)}
        writeCell={writeCell}
      />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;

    typeAndCommit(input, '1..2');

    await waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));
    expect(writeCell).not.toHaveBeenCalled();
  });

  it("ne commit pas quand la valeur n'a pas change", () => {
    const writeCell = vi.fn();
    render(
      <UserDataCell
        cell={{ kind: 'user-data', value: 12, valueId: 100, coveringSources: [] }}
        ariaLabel="NOx 2030"
        indicateurId={toIndicateurId(12)}
        year={toYear(2030)}
        writeCell={writeCell}
      />
    );
    const input = screen.getByRole('textbox');

    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(writeCell).not.toHaveBeenCalled();
  });
});
