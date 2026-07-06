import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { appLabels } from '../../../../labels/catalog';
import { toYear } from '../types';
import { ReferenceYearEditor } from './reference-year-editor';

const openModal = (onReferenceYearChange: () => void): HTMLInputElement => {
  const year = toYear(2020);
  render(
    <ReferenceYearEditor
      year={year}
      onReferenceYearChange={onReferenceYearChange}
    />
  );
  fireEvent.click(
    screen.getByRole('button', {
      name: appLabels.indicateurModifierAnneeReference(year),
    })
  );
  return screen.getByRole('textbox', {
    name: appLabels.indicateurAnneeReferenceChamp,
  }) as HTMLInputElement;
};

const clickConfirm = (): void =>
  fireEvent.click(screen.getByRole('button', { name: appLabels.confirmer }));

const isModalClosed = (): boolean =>
  screen.queryByRole('textbox', {
    name: appLabels.indicateurAnneeReferenceChamp,
  }) === null;

describe('ReferenceYearEditor', () => {
  it("ouvre la modale de saisie au clic sur l'année", () => {
    openModal(vi.fn());

    expect(
      screen.getByRole('textbox', {
        name: appLabels.indicateurAnneeReferenceChamp,
      })
    ).toBeDefined();
    expect(
      screen.getByRole('button', { name: appLabels.confirmer })
    ).toBeDefined();
  });

  it("enregistre l'année saisie à la confirmation", async () => {
    const onReferenceYearChange = vi.fn();
    const input = openModal(onReferenceYearChange);
    fireEvent.change(input, { target: { value: '2018' } });
    clickConfirm();

    await waitFor(() =>
      expect(onReferenceYearChange).toHaveBeenCalledWith(2018)
    );
  });

  it("n'enregistre pas quand la modale est annulée", async () => {
    const onReferenceYearChange = vi.fn();
    const input = openModal(onReferenceYearChange);
    fireEvent.change(input, { target: { value: '2018' } });
    fireEvent.click(screen.getByRole('button', { name: appLabels.annuler }));

    await waitFor(() => expect(isModalClosed()).toBe(true));
    expect(onReferenceYearChange).not.toHaveBeenCalled();
  });

  it("affiche le message et n'enregistre pas une année avant 2010", async () => {
    const onReferenceYearChange = vi.fn();
    const input = openModal(onReferenceYearChange);
    fireEvent.change(input, { target: { value: '2009' } });
    clickConfirm();

    await screen.findByText(
      appLabels.indicateurAnneeReferenceInvalide(2010, 2029)
    );
    expect(onReferenceYearChange).not.toHaveBeenCalled();
  });

  it("affiche le message et n'enregistre pas une année après 2029", async () => {
    const onReferenceYearChange = vi.fn();
    const input = openModal(onReferenceYearChange);
    fireEvent.change(input, { target: { value: '2030' } });
    clickConfirm();

    await screen.findByText(
      appLabels.indicateurAnneeReferenceInvalide(2010, 2029)
    );
    expect(onReferenceYearChange).not.toHaveBeenCalled();
  });

  it("n'enregistre pas et ferme quand l'année est inchangée", async () => {
    const onReferenceYearChange = vi.fn();
    openModal(onReferenceYearChange);
    clickConfirm();

    await waitFor(() => expect(isModalClosed()).toBe(true));
    expect(onReferenceYearChange).not.toHaveBeenCalled();
  });
});
