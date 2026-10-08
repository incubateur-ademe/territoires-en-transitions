import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AddIndicateurPeriodeHeader } from './add-indicateur-periode.header';

afterEach(cleanup);

describe('AddIndicateurPeriodeHeader', () => {
  it('conserve le brouillon invalide et ses zéros au changement de focus', () => {
    const onAdd = vi.fn();
    const { getByRole, queryByRole } = render(
      <AddIndicateurPeriodeHeader
        periodicite={IndicateurPeriodiciteEnum.ANNUELLE}
        existingPeriodes={[]}
        onAdd={onAdd}
      />
    );
    const input = getByRole('textbox', {
      name: 'Ajouter une année',
    }) as HTMLInputElement;

    fireEvent.change(input, { target: { value: '0000' } });
    fireEvent.blur(input);

    expect(input.value).toBe('0000');
    expect(
      queryByRole('button', { name: 'Valider et ajouter une année' })
    ).toBeNull();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('ignore les caractères non numériques et refuse un cinquième chiffre', () => {
    const { getByRole } = render(
      <AddIndicateurPeriodeHeader
        periodicite={IndicateurPeriodiciteEnum.ANNUELLE}
        existingPeriodes={[]}
        onAdd={vi.fn()}
      />
    );
    const input = getByRole('textbox', {
      name: 'Ajouter une année',
    }) as HTMLInputElement;

    for (const character of '2a0b2c6') {
      fireEvent.change(input, {
        target: { value: input.value + character },
      });
    }
    expect(input.value).toBe('2026');

    fireEvent.change(input, { target: { value: '20267' } });
    expect(input.value).toBe('2026');
    expect(
      getByRole('button', { name: 'Valider et ajouter une année' })
    ).toBeTruthy();
  });
});
