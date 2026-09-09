import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurDisplayPeriodiciteSelect } from './indicateur-display-periodicite.select';

describe('indicator chart display selection', () => {
  it('allows annual display for monthly declarations', () => {
    const onChange = vi.fn();
    render(
      <IndicateurDisplayPeriodiciteSelect
        periodicite="mensuelle"
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'ouvrir le menu' }));
    fireEvent.click(screen.getByText('Annuelle'));

    expect(onChange).toHaveBeenCalledWith('annuelle');
    expect(screen.getByText(/sans agrégation/)).toBeTruthy();
  });

  it('offers only annual display for annual declarations', () => {
    const onChange = vi.fn();
    render(
      <IndicateurDisplayPeriodiciteSelect
        periodicite="annuelle"
        onChange={onChange}
      />
    );

    expect(
      screen
        .getByRole('button', { name: 'ouvrir le menu' })
        .hasAttribute('disabled')
    ).toBe(true);
    expect(screen.queryByText('Mensuelle')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});
