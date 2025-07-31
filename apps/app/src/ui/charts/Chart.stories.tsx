import { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';

import { Button } from '@/ui';

import Chart from './Chart';
import { fakeComplexeDonutData, fakeSimpleDonutData } from './Donut/fixtures';
import { additionalInfos, fakeChartInfos } from './fixtures';

const meta: Meta<typeof Chart> = {
  component: Chart,
  args: {
    donut: {
      chart: {
        data: fakeSimpleDonutData,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Chart>;

export const Defaut: Story = {};

export const AvecLegend: Story = {
  args: {
    donut: {
      chart: {
        data: fakeSimpleDonutData,
        legend: {
          isOpen: true,
        },
      },
    },
  },
};

export const Charts: Story = {
  args: {},
  render: () => {
    return (
      <div className="flex flex-col gap-6">
        <Chart
          donut={{
            chart: { data: fakeSimpleDonutData },
          }}
        />
        <div className="h-px bg-grey-4" />
      </div>
    );
  },
};

export const Download = () => {
  const [donutOpen, setDonutOpen] = useState(false);
  return (
    <div className="flex flex-col gap-6">
      <div className="w-80">
        <Button
          icon="zoom-in-line"
          size="sm"
          variant="outlined"
          onClick={() => setDonutOpen(true)}
        />
        <Chart
          donut={{
            chart: { data: fakeComplexeDonutData },
          }}
          infos={{
            ...fakeChartInfos,
            modal: {
              isOpen: donutOpen,
              setIsOpen: setDonutOpen,
            },
            fileName: 'donut-chart',
            additionalInfos,
          }}
        />
      </div>
    </div>
  );
};
