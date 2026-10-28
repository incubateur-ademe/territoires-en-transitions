import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Box } from './box';
import { Grid } from './grid';
import { Inline } from './inline';
import { Stack } from './stack';

afterEach(cleanup);

describe('primitives de layout', () => {
  it('rendent une div par défaut avec les classes de layout', () => {
    render(<Stack data-testid="stack">Contenu</Stack>);

    const stack = screen.getByTestId('stack');
    expect(stack.tagName).toBe('DIV');
    expect(stack.className).toBe('flex flex-col gap-4');
  });

  it("rendent l'élément sémantique demandé et transmettent les attributs", () => {
    render(
      <Grid as="ul" columns={2} aria-label="Indicateurs">
        <li>Un</li>
      </Grid>
    );

    const list = screen.getByRole('list', { name: 'Indicateurs' });
    expect(list.className).toBe('grid grid-cols-2 gap-4');
  });

  it('laissent la className surcharger le layout, en dernier recours', () => {
    render(
      <Inline data-testid="inline" gap="sm" className="gap-3 text-sm">
        Contenu
      </Inline>
    );

    expect(screen.getByTestId('inline').className).toBe(
      'flex flex-row flex-wrap gap-3 text-sm'
    );
  });

  it("rendent un Box sans attribut class quand aucun padding n'est demandé", () => {
    render(<Box data-testid="box">Contenu</Box>);

    expect(screen.getByTestId('box').hasAttribute('class')).toBe(false);
  });
});
