import React from 'react';
import {Meta, StoryObj} from '@storybook/nextjs';

import {
  fakeComplexeDonutData,
  fakeNoDonutData,
  fakeSimpleDonutData,
  fakeSmallDonutData,
} from './fixtures';
import DonutChart from './DonutChart';

const meta: Meta<typeof DonutChart> = {
  component: DonutChart,
  args: {
    onClick: undefined,
  },
  render: args => <DonutChart {...args} />,
};

export default meta;

type Story = StoryObj<typeof DonutChart>;

export const Defaut: Story = {
  args: {
    data: fakeSimpleDonutData,
  },
};

export const NoData: Story = {
  args: {
    data: fakeNoDonutData,
  },
};

export const AvecLegende: Story = {
  args: {
    data: fakeComplexeDonutData,
    displayOutsideLabel: true,
    legend: {
      isOpen: true,
      maxItems: 5,
    },
  },
};

export const ArcsTresFins: Story = {
  args: {
    data: fakeSmallDonutData,
    displayOutsideLabel: true,
  },
};

export const Cliquable: Story = {
  args: {
    data: fakeSimpleDonutData,
    onClick: () => alert('clicked'),
  },
};

export const AvecElementAuCentre: Story = {
  args: {
    data: fakeSimpleDonutData,
    centeredElement: (
      <>
        <div className="text-sm">
          custom
          <br />
          element
        </div>
        <div className="font-bold text-primary-7 text-lg">300%</div>
      </>
    ),
  },
};
