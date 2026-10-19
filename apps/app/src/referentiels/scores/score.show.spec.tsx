import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ScoreShow from './score.show';

vi.mock('@tet/ui', () => ({ Icon: () => null }));

afterEach(cleanup);

describe('ScoreShow', () => {
  it.each([
    { score: 0.3744, expected: /^37[.,]4\s%$/ },
    { score: 0.37449, expected: /^37[.,]4\s%$/ },
    { score: 0.3745, expected: /^37[.,]5\s%$/ },
    { score: 0.0633, expected: /^6[.,]3\s%$/ },
    { score: 0.0094, expected: /^0[.,]9\s%$/ },
    { score: 0, expected: /^0\s%$/ },
    { score: 1, expected: /^100\s%$/ },
  ])(
    'affiche $score en pourcentage avec une décimale au maximum',
    ({ score, expected }) => {
      render(<ScoreShow score={score} percent />);

      expect(screen.getByText(expected)).toBeTruthy();
    }
  );
});
