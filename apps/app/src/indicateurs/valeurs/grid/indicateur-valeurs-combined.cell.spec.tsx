import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IndicateurValeursCombinedCell } from './indicateur-valeurs-combined.cell';
import type { IndicateurValeurField } from './types';

afterEach(cleanup);

function EditableCell({
  onSave = async () => true,
  resultat = 0,
  objectif = null,
  readonly = false,
}: {
  onSave?: (
    type: IndicateurValeurField,
    value: number | null
  ) => Promise<boolean>;
  resultat?: number | null;
  objectif?: number | null;
  readonly?: boolean;
}) {
  const [values, setValues] = useState({ resultat, objectif });
  return (
    <IndicateurValeursCombinedCell
      periodeLabel="2026"
      {...values}
      readonly={readonly}
      onSave={async (type, value) => {
        const saved = await onSave(type, value);
        if (saved) setValues((previous) => ({ ...previous, [type]: value }));
        return saved;
      }}
    />
  );
}

describe('cellule résultat / objectif', () => {
  it('modifie un zéro et ajoute un objectif sans changer le résultat', async () => {
    const save = vi.fn(async () => true);
    render(<EditableCell onSave={save} />);
    fireEvent.click(screen.getByRole('button', { name: 'Résultat — 2026' }));
    const result = screen.getByRole('textbox', {
      name: 'Résultat — 2026',
    });
    expect((result as HTMLInputElement).value).toBe('0');
    fireEvent.change(result, { target: { value: '12,5' } });
    fireEvent.keyDown(result, { key: 'Enter' });
    await waitFor(() => expect(save).toHaveBeenCalledWith('resultat', 12.5));
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: 'Objectif — 2026' }));
    const objective = screen.getByRole('textbox', {
      name: 'Objectif — 2026',
    });
    fireEvent.change(objective, { target: { value: '20' } });
    fireEvent.blur(objective);
    await waitFor(() => expect(save).toHaveBeenCalledWith('objectif', 20));
    await waitFor(() => expect(screen.getByText('12,5')).toBeDefined());
  });

  it('propose les deux types dans une cellule vide', async () => {
    const save = vi.fn(async () => true);
    render(<EditableCell resultat={null} onSave={save} />);
    fireEvent.click(screen.getByRole('button', { name: /Ajouter une donnée/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Objectif' }));
    const input = screen.getByRole('textbox', {
      name: 'Objectif — 2026',
    });
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(save).toHaveBeenCalledWith('objectif', 0));
  });

  it('préserve les décimales au-delà de la précision du champ PCAET', async () => {
    const save = vi.fn(async () => true);
    render(<EditableCell onSave={save} />);
    fireEvent.click(screen.getByRole('button', { name: 'Résultat — 2026' }));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '12,345678' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('resultat', 12.345678)
    );
    await waitFor(() => expect(screen.getByText('12,345678')).toBeDefined());
  });

  it('garde l’éditeur ouvert jusqu’à la confirmation de sauvegarde', async () => {
    let resolve: (saved: boolean) => void = () => undefined;
    const promise = new Promise<boolean>((resolveSave) => {
      resolve = resolveSave;
    });
    render(<EditableCell onSave={() => promise} />);
    fireEvent.click(screen.getByRole('button', { name: 'Résultat — 2026' }));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '7' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByRole('textbox').getAttribute('aria-busy')).toBe('true');
    await act(async () => resolve(true));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByText('7')).toBeDefined();
  });

  it('conserve le brouillon et permet de retenter après une erreur serveur', async () => {
    const save = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    render(<EditableCell onSave={save} />);
    fireEvent.click(screen.getByRole('button', { name: 'Résultat — 2026' }));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '7' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() =>
      expect(screen.getByRole('textbox').getAttribute('aria-invalid')).toBe(
        'true'
      )
    );
    expect((input as HTMLInputElement).value).toBe('7');
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('annule avec Échap sans écrire, même si le champ perd le focus', async () => {
    const save = vi.fn(async () => true);
    render(<EditableCell onSave={save} />);
    fireEvent.click(screen.getByRole('button', { name: 'Résultat — 2026' }));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '9' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    fireEvent.blur(input);
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByText('0')).toBeDefined();
  });

  it('affiche les valeurs importées sans proposer de saisie', () => {
    render(<EditableCell readonly resultat={0} objectif={20} />);
    expect(screen.getByText('0')).toBeDefined();
    expect(screen.getByText('20')).toBeDefined();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('place le bouton commentaire sur la même ligne que sa valeur', () => {
    render(
      <IndicateurValeursCombinedCell
        periodeLabel="2026"
        resultat={12.5}
        objectif={20}
        actions={{
          resultat: (
            <button title="Commentaire du résultat — 2026">
              {'commentaire résultat'}
            </button>
          ),
          objectif: (
            <button title="Commentaire de l'objectif — 2026">
              {'commentaire objectif'}
            </button>
          ),
        }}
        onSave={vi.fn(async () => true)}
      />
    );

    const resultButton = screen.getByRole('button', {
      name: 'Résultat — 2026',
    });
    const resultCommentButton = screen.getByTitle(
      'Commentaire du résultat — 2026'
    );
    const objectiveButton = screen.getByRole('button', {
      name: 'Objectif — 2026',
    });
    const objectiveCommentButton = screen.getByTitle(
      "Commentaire de l'objectif — 2026"
    );

    expect(resultCommentButton.parentElement).toBe(resultButton.parentElement);
    expect(objectiveCommentButton.parentElement).toBe(
      objectiveButton.parentElement
    );
  });
});
