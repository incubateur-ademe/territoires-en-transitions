import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('préserve les sémantiques natives et la ref pour un mois', () => {
    const ref = createRef<HTMLInputElement>();

    render(
      <Input
        ref={ref}
        type="month"
        aria-label="Mois"
        value="2026-02"
        readOnly
      />
    );

    const input = screen.getByLabelText('Mois');
    expect(input).toHaveAttribute('type', 'month');
    expect(input).toHaveValue('2026-02');
    expect(ref.current).toBe(input);
  });
});
