import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { JSX, useState } from 'react';
import { fn } from 'storybook/test';

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

const meta: Meta<typeof SegmentedControl<Pertinence>> = {
  component: SegmentedControl,
  decorators: [(story) => <div className="p-8 max-w-2xl">{story()}</div>],
  args: {
    legend: 'Pertinence du levier',
    options,
    onChange: fn(),
  },
  render: (args) => <SegmentedControlWithState key={args.value} {...args} />,
};

export default meta;

type Story = StoryObj<typeof SegmentedControl<Pertinence>>;

export const WithValue: Story = {
  args: {
    value: 'a_discuter',
  },
};

export const WithoutValue: Story = {};

export const VisibleLegend: Story = {
  args: {
    isLegendVisible: true,
    value: 'pertinent',
  },
};

export const ExtraSmall: Story = {
  args: {
    size: 'xs',
    value: 'non_pertinent',
  },
};
