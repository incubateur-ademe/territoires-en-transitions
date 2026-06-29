import { render, screen } from '@testing-library/react';
import { ZxcvbnResult } from '@zxcvbn-ts/core';
import { describe, expect, it } from 'vitest';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

/** Crée un ZxcvbnResult minimal pour les tests (seuls score et feedback sont utilisés) */
const makeStrength = (score: 0 | 1 | 2 | 3 | 4): ZxcvbnResult =>
  ({ score, feedback: { suggestions: [], warning: '' } }) as ZxcvbnResult;

describe('PasswordStrengthMeter', () => {
  it('score 0 : pas de libellé affiché', () => {
    render(<PasswordStrengthMeter strength={makeStrength(0)} />);
    expect(screen.queryByText(/Faible|Moyen|Robuste/)).toBeNull();
  });

  it('score 1 (faible) : affiche "Faible"', () => {
    render(<PasswordStrengthMeter strength={makeStrength(1)} />);
    expect(screen.getByText('Faible')).toBeTruthy();
  });

  it('score 2 (passable → moyen) : affiche "Moyen"', () => {
    render(<PasswordStrengthMeter strength={makeStrength(2)} />);
    expect(screen.getByText('Moyen')).toBeTruthy();
  });

  it('score 3 (bon → moyen) : affiche "Moyen"', () => {
    render(<PasswordStrengthMeter strength={makeStrength(3)} />);
    expect(screen.getByText('Moyen')).toBeTruthy();
  });

  it('score 4 (robuste) : affiche "Robuste"', () => {
    render(<PasswordStrengthMeter strength={makeStrength(4)} />);
    expect(screen.getByText('Robuste')).toBeTruthy();
  });
});
