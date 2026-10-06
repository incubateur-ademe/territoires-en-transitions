import { fireEvent, render, screen, within } from '@testing-library/react';
import { Pertinence } from '@tet/domain/collectivites';
import { describe, expect, it, vi } from 'vitest';
import { PertinenceToggle } from './pertinence-toggle';

const TOGGLE_LABEL = 'Pertinence du levier Biogaz';

const clickToggle = (value?: Pertinence): ReturnType<typeof vi.fn> => {
  const onChange = vi.fn();
  render(
    <PertinenceToggle label={TOGGLE_LABEL} value={value} onChange={onChange} />
  );
  fireEvent.click(
    within(screen.getByRole('group', { name: TOGGLE_LABEL })).getByRole(
      'button'
    )
  );
  return onChange;
};

describe('PertinenceToggle', () => {
  it.each([
    ['non renseigné', undefined],
    ['pertinent', 'pertinent'],
  ] as const)('propose de marquer non pertinent un levier %s', (_, value) => {
    const onChange = clickToggle(value);

    expect(
      screen.getByRole('button', { name: 'Marquer non pertinent' })
    ).toBeDefined();
    expect(onChange).toHaveBeenCalledWith('non_pertinent');
  });

  it('propose de marquer pertinent un levier non pertinent', () => {
    const onChange = clickToggle('non_pertinent');

    expect(
      screen.getByRole('button', { name: 'Marquer pertinent' })
    ).toBeDefined();
    expect(onChange).toHaveBeenCalledWith('pertinent');
  });
});
