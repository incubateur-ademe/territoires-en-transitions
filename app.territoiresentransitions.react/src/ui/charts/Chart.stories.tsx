import React, {useState} from 'react';
import {Meta, StoryObj} from '@storybook/react';

import {Button} from '@tet/ui';

import Chart from './Chart';
import {fakeComplexeDonutData, fakeSimpleDonutData} from './Donut/fixtures';
import {additionalInfos, fakeChartInfos} from './fixtures';
import {fakeManyXLineData} from './Line/fixtures';

const meta: Meta<typeof Chart> = {
  component: Chart,
  parameters: {storyshots: false}, // @nivo/line semble fait échoué storyshot :(
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
            chart: {data: fakeSimpleDonutData},
          }}
        />
        <div className="h-px bg-grey-4" />
        <Chart
          line={{
            chart: {data: fakeManyXLineData},
          }}
        />
      </div>
    );
  },
};

export const Download = () => {
  const [donutOpen, setDonutOpen] = useState(false);
  const [lineOpen, setLineOpen] = useState(false);
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
            chart: {data: fakeComplexeDonutData},
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
      <div className="h-px bg-grey-4" />
      <div>
        <Button
          icon="zoom-in-line"
          size="sm"
          variant="outlined"
          onClick={() => setLineOpen(true)}
          className="mb-6"
        />
        <Chart
          line={{
            chart: {
              data: fakeManyXLineData,
              colors: {datum: 'color'},
              axisLeftLegend: 'Nombre de yolo en kw/h',
            },
            modalChart: {
              axisBottom: {
                tickValues: 5,
              },
            },
          }}
          infos={{
            ...fakeChartInfos,
            modal: {
              isOpen: lineOpen,
              setIsOpen: setLineOpen,
              size: 'xl',
            },
            fileName: 'line-chart',
            additionalInfos,
          }}
        />
      </div>
    </div>
  );
};
