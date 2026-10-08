import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { IndicateurPeriods } from '@tet/domain/indicateurs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import {
  IndicateurCombinedValue,
  IndicateurValeursTable,
} from './indicateur-valeurs-table';
import { prepareData } from '../data/prepare-data';
import type { SourceType } from '../types';

const period = IndicateurPeriods.parse('mensuelle', '2026-02');
afterEach(cleanup);

function EditableCell({
  onSave = async () => true,
  resultat = 0,
  objectif = null,
  readonly = false,
}: {
  onSave?: (type: SourceType, value: number | null) => Promise<boolean>;
  resultat?: number | null;
  objectif?: number | null;
  readonly?: boolean;
}) {
  const [values, setValues] = useState({ resultat, objectif });
  return (
    <IndicateurCombinedValue
      period={period}
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
    fireEvent.click(
      screen.getByRole('button', { name: 'Résultat — février 2026' })
    );
    const result = screen.getByRole('textbox', {
      name: 'Résultat — février 2026',
    });
    expect((result as HTMLInputElement).value).toBe('0');
    fireEvent.change(result, { target: { value: '12,5' } });
    fireEvent.keyDown(result, { key: 'Enter' });
    await waitFor(() => expect(save).toHaveBeenCalledWith('resultat', 12.5));
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
    fireEvent.click(
      screen.getByRole('button', { name: 'Objectif — février 2026' })
    );
    const objective = screen.getByRole('textbox', {
      name: 'Objectif — février 2026',
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
      name: 'Objectif — février 2026',
    });
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(save).toHaveBeenCalledWith('objectif', 0));
  });

  it('conserve le brouillon et permet de retenter après une erreur serveur', async () => {
    const save = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    render(<EditableCell onSave={save} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Résultat — février 2026' })
    );
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
    fireEvent.click(
      screen.getByRole('button', { name: 'Résultat — février 2026' })
    );
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

  it('rend le tableau vide avec son ajout de période', () => {
    render(
      <IndicateurValeursTable
        definition={{
          titre: 'Flotte électrique',
          unite: '%',
          periodicite: 'mensuelle',
        }}
        resultats={prepareData(undefined, 'resultat', true)}
        objectifs={prepareData(undefined, 'objectif', true)}
        getColorBySourceId={() => '#000091'}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        onComment={vi.fn()}
        addPeriod={<button>{'Ajouter un mois'}</button>}
      />
    );
    expect(
      screen.getByRole('table', { name: 'Flotte électrique' })
    ).toBeDefined();
    expect(
      screen.getByRole('button', { name: 'Ajouter un mois' })
    ).toBeDefined();
  });
});
