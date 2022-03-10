import {Story, Meta} from '@storybook/react';
// import { action } from '@storybook/addon-actions';
import {
  FeaturesUseBarChart,
  TFeaturesUseBarChartProps,
} from './FeaturesUseBarChart';
import {proportions} from './fixture.json';

export default {
  component: FeaturesUseBarChart,
} as Meta;

const Template: Story<TFeaturesUseBarChartProps> = args => (
  <FeaturesUseBarChart {...args} />
);

export const Exemple1 = Template.bind({});
Exemple1.args = {
  widthPx: 500,
  proportions,
};
