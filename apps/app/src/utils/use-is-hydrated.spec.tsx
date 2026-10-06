import { render, screen } from '@testing-library/react';
import { JSX } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useIsHydrated } from './use-is-hydrated';

const HydrationProbe = (): JSX.Element => (
  <output>{String(useIsHydrated())}</output>
);

describe('useIsHydrated', () => {
  it('vaut false au rendu serveur, pour que le HTML ne dépende pas du navigateur', () => {
    expect(renderToString(<HydrationProbe />)).toBe('<output>false</output>');
  });

  it('vaut true une fois rendu dans le navigateur', () => {
    render(<HydrationProbe />);

    expect(screen.getByRole('status').textContent).toBe('true');
  });
});
