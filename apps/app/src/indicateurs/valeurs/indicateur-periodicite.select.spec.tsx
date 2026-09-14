import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurPeriodiciteSelect } from './indicateur-periodicite.select';

const options = [
  { value: 'annuelle' as const, label: 'Annuelle' },
  { value: 'mensuelle' as const, label: 'Mensuelle' },
];

describe('collectivité periodicity selection', () => {
  it('shows the imposed cadence as read-only', () => {
    const onChange = vi.fn();
    render(
      <IndicateurPeriodiciteSelect
        mode="imposee"
        periodiciteParDefaut="annuelle"
        periodicitePersonnalisee={null}
        options={options}
        onChange={onChange}
      />
    );
    expect(
      screen
        .getByRole('button', { name: 'ouvrir le menu' })
        .hasAttribute('disabled')
    ).toBe(true);
    expect(screen.getByText(/imposée par le catalogue/)).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('lets the collectivité choose monthly tracking for an annual recommendation', () => {
    const onChange = vi.fn();
    render(
      <IndicateurPeriodiciteSelect
        mode="recommandee"
        periodiciteParDefaut="annuelle"
        periodicitePersonnalisee={null}
        options={options}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'ouvrir le menu' }));
    fireEvent.click(screen.getByText('Mensuelle'));
    expect(onChange).toHaveBeenCalledWith('mensuelle');
    expect(screen.getByText(/sans conversion automatique/)).toBeTruthy();
  });
});
