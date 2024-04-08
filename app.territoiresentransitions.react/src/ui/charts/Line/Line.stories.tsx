import React from 'react';
import {Meta, StoryObj} from '@storybook/react';

import {
  fakeManyXLineData,
  fakeNoLineData,
  fakeSimpleLineData,
} from './fixtures';

import LineChart from './LineChart';

const meta: Meta<typeof LineChart> = {
  component: LineChart,
  parameters: {storyshots: false}, // @nivo/line semble fait échoué storyshot :(
  args: {},
  render: args => <LineChart {...args} />,
};

export default meta;

type Story = StoryObj<typeof LineChart>;

export const Defaut: Story = {
  args: {
    data: fakeSimpleLineData,
    axisLeftLegend: 'Nombre de yolo en kw/h',
    legend: {
      isOpen: true,
    },
  },
};

export const NoData: Story = {
  args: {
    data: fakeNoLineData,
    axisLeftLegend: 'Nombre de yolo en kw/h',
  },
};

export const AvecLegendeEtCustomColors: Story = {
  args: {
    data: fakeManyXLineData,
    axisLeftLegend: 'Nombre de yolo en kw/h',
    colors: {datum: 'color'},
    legend: {
      isOpen: true,
    },
  },
};
