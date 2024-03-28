import {Meta, StoryObj} from '@storybook/react';
import IndicateurChart from './IndicateurChart';
import {fakeIndicateurValeurs} from './fixtures';

const meta: Meta<typeof IndicateurChart> = {
  component: IndicateurChart,
  parameters: {storyshots: false}, // @nivo/line semble fait échoué storyshot :(
};

export default meta;

type Story = StoryObj<typeof IndicateurChart>;

export const Simple: Story = {
  args: {
    isLoading: false,
    data: {
      valeurs: fakeIndicateurValeurs,
    },
    chartConfig: {
      legend: {
        isOpen: true,
      },
    },
  },
};

export const NonRenseigne: Story = {
  args: {
    isLoading: false,
    data: {
      valeurs: [],
    },
  },
};

export const Chargement: Story = {
  args: {
    isLoading: true,
    data: {
      valeurs: [],
    },
  },
};
