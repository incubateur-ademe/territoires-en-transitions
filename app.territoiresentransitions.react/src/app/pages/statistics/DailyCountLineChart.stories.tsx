import {Story, Meta} from '@storybook/react';
// import { action } from '@storybook/addon-actions';
import {
  DailyCountLineChart,
  TDailyCountLineChartProps,
} from './DailyCountLineChart';
import dailyCounts from './fixture.json';

export default {
  component: DailyCountLineChart,
} as Meta;

const Template: Story<TDailyCountLineChartProps> = args => (
  <DailyCountLineChart {...args} />
);

export const Exemple1 = Template.bind({});
Exemple1.args = {
  widthPx: 650,
  dailyCounts,
};
