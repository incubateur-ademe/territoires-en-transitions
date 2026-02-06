import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Slider } from './slider';

const meta: Meta<typeof Slider> = {
  component: Slider,
};

export default meta;

type Story = StoryObj<typeof Slider>;

export const Simple: Story = {
  args: {
    defaultValue: [50],
  },
};

export const Range: Story = {
  args: {
    defaultValue: [25, 50],
  },
};

const RenderMultiRangeCustomColors = () => {
  const [value, setValue] = useState([25, 50, 75]);
  return (
    <Slider
      value={value}
      onValueChange={(newValue) => setValue(newValue)}
      rangeColors={['red', 'green', 'blue', 'orange']}
    />
  );
};

export const MultiRangeCustomColors: Story = {
  render: () => <RenderMultiRangeCustomColors />,
};
