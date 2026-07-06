import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { appLabels } from '../../../../labels/catalog';
import { toYear } from '../types';
import { ReferenceYearEditor } from './reference-year-editor';

const openEditor = (onReferenceYearChange: () => void): HTMLInputElement => {
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

const submitForm = (input: HTMLInputElement): void => {
  const form = input.closest('form');
  if (form === null) {
    throw new Error('form not found');
  }
  fireEvent.submit(form);
};

const isEditorClosed = (): boolean =>
  screen.queryByRole('textbox', {
    name: appLabels.indicateurAnneeReferenceChamp,
  }) === null;

const findConfirmButton = (): Promise<HTMLElement> =>
  screen.findByRole('button', { name: appLabels.confirmer });

describe('ReferenceYearEditor', () => {
  it("enregistre l'année saisie après confirmation", async () => {
    const onReferenceYearChange = vi.fn();
    const input = openEditor(onReferenceYearChange);
    fireEvent.change(input, { target: { value: '2018' } });
    submitForm(input);
    const confirm = await findConfirmButton();
    expect(onReferenceYearChange).not.toHaveBeenCalled();
    fireEvent.click(confirm);
    await waitFor(() =>
      expect(onReferenceYearChange).toHaveBeenCalledWith(2018)
    );
  });

  it("n'enregistre pas quand la confirmation est annulée", async () => {
    const onReferenceYearChange = vi.fn();
    const input = openEditor(onReferenceYearChange);
    fireEvent.change(input, { target: { value: '2018' } });
    submitForm(input);
    await findConfirmButton();
    fireEvent.click(screen.getByRole('button', { name: appLabels.annuler }));
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: appLabels.confirmer })
      ).toBeNull()
    );
    expect(onReferenceYearChange).not.toHaveBeenCalled();
  });

  it("affiche le message et n'enregistre pas une année avant 2010", async () => {
    const onReferenceYearChange = vi.fn();
    const input = openEditor(onReferenceYearChange);
    fireEvent.change(input, { target: { value: '2009' } });
    submitForm(input);
    await screen.findByText(
      appLabels.indicateurAnneeReferenceInvalide(2010, 2029)
    );
    expect(
      screen.queryByRole('button', { name: appLabels.confirmer })
    ).toBeNull();
    expect(onReferenceYearChange).not.toHaveBeenCalled();
  });

  it("affiche le message et n'enregistre pas une année après 2029", async () => {
    const onReferenceYearChange = vi.fn();
    const input = openEditor(onReferenceYearChange);
    fireEvent.change(input, { target: { value: '2030' } });
    submitForm(input);
    await screen.findByText(
      appLabels.indicateurAnneeReferenceInvalide(2010, 2029)
    );
    expect(onReferenceYearChange).not.toHaveBeenCalled();
  });

  it("ne demande pas de confirmation quand l'année est inchangée", async () => {
    const onReferenceYearChange = vi.fn();
    const input = openEditor(onReferenceYearChange);
    submitForm(input);
    await waitFor(() => expect(isEditorClosed()).toBe(true));
    expect(
      screen.queryByRole('button', { name: appLabels.confirmer })
    ).toBeNull();
    expect(onReferenceYearChange).not.toHaveBeenCalled();
  });

  it('annule sur Échap sans enregistrer', () => {
    const onReferenceYearChange = vi.fn();
    const input = openEditor(onReferenceYearChange);
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(isEditorClosed()).toBe(true);
    expect(onReferenceYearChange).not.toHaveBeenCalled();
  });
});
