import '@testing-library/jest-dom/vitest';

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JSX, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  SegmentedControl,
  SegmentedControlOption,
  SegmentedControlProps,
} from './segmented-control';

type Pertinence = 'non_pertinent' | 'a_discuter' | 'pertinent';

const options: readonly SegmentedControlOption<Pertinence>[] = [
  { value: 'non_pertinent', label: 'Non pertinent' },
  { value: 'a_discuter', label: "À discuter avec l'élu" },
  { value: 'pertinent', label: 'Pertinent' },
];

const SegmentedControlWithState = (
  props: SegmentedControlProps<Pertinence>
): JSX.Element => {
  const [value, setValue] = useState<Pertinence | undefined>(props.value);
  const handleChange = (nextValue: Pertinence): void => {
    setValue(nextValue);
    props.onChange(nextValue);
  };
  return <SegmentedControl {...props} value={value} onChange={handleChange} />;
};

describe('SegmentedControl', () => {
  it('expose un radiogroup nommé par sa légende', () => {
    render(
      <SegmentedControl
        legend="Pertinence du levier"
        options={options}
        onChange={vi.fn()}
      />
    );

    expect(
      screen.getByRole('radiogroup', { name: 'Pertinence du levier' })
    ).toBeInTheDocument();
  });

  it('coche uniquement le radio de la valeur courante', () => {
    render(
      <SegmentedControl
        legend="Pertinence du levier"
        options={options}
        value="a_discuter"
        onChange={vi.fn()}
      />
    );

    expect(
      screen.getByRole('radio', { name: "À discuter avec l'élu" })
    ).toBeChecked();
    expect(
      screen.getByRole('radio', { name: 'Non pertinent' })
    ).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Pertinent' })).not.toBeChecked();
  });

  it('ne coche aucun radio sans valeur', () => {
    render(
      <SegmentedControl
        legend="Pertinence du levier"
        options={options}
        onChange={vi.fn()}
      />
    );

    screen
      .getAllByRole('radio')
      .forEach((radio) => expect(radio).not.toBeChecked());
  });

  it('choisit la valeur suivante avec la flèche droite', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SegmentedControlWithState
        legend="Pertinence du levier"
        options={options}
        value="non_pertinent"
        onChange={onChange}
      />
    );

    await user.tab();
    await user.keyboard('{ArrowRight}');

    expect(onChange).toHaveBeenCalledExactlyOnceWith('a_discuter');
  });

  it('garde la valeur du parent tant que le parent ne la change pas', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SegmentedControl
        legend="Pertinence du levier"
        options={options}
        value="non_pertinent"
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole('radio', { name: 'Pertinent' }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith('pertinent');
    expect(screen.getByRole('radio', { name: 'Non pertinent' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Pertinent' })).not.toBeChecked();
  });

  it('suit la valeur quand le parent la change', () => {
    const { rerender } = render(
      <SegmentedControl
        legend="Pertinence du levier"
        options={options}
        value="non_pertinent"
        onChange={vi.fn()}
      />
    );

    rerender(
      <SegmentedControl
        legend="Pertinence du levier"
        options={options}
        value="pertinent"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole('radio', { name: 'Pertinent' })).toBeChecked();
    expect(
      screen.getByRole('radio', { name: 'Non pertinent' })
    ).not.toBeChecked();
  });

  it('garde le choix de chaque groupe quand deux groupes coexistent', async () => {
    const user = userEvent.setup();
    render(
      <>
        <SegmentedControlWithState
          legend="Levier A"
          options={options}
          value="pertinent"
          onChange={vi.fn()}
        />
        <SegmentedControlWithState
          legend="Levier B"
          options={options}
          onChange={vi.fn()}
        />
      </>
    );

    const groupA = screen.getByRole('radiogroup', { name: 'Levier A' });
    const groupB = screen.getByRole('radiogroup', { name: 'Levier B' });
    await user.click(
      within(groupB).getByRole('radio', { name: 'Non pertinent' })
    );

    expect(
      within(groupA).getByRole('radio', { name: 'Pertinent' })
    ).toBeChecked();
    expect(
      within(groupB).getByRole('radio', { name: 'Non pertinent' })
    ).toBeChecked();
  });
});
