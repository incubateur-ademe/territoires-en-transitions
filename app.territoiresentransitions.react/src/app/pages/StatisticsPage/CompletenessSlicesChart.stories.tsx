import {Story, Meta} from '@storybook/react';
import {
  CompletenessSlicesChart,
  TCompletenessSlicesChartProps,
} from './CompletenessSlicesChart';
import {slices} from './fixture.json';

export default {
  component: CompletenessSlicesChart,
} as Meta;

const Template: Story<TCompletenessSlicesChartProps> = args => (
  <CompletenessSlicesChart {...args} widthPx={350} />
);

export const ECI = Template.bind({});
ECI.args = {
  slices,
  referentiel: 'eci',
};

export const CAE = Template.bind({});
CAE.args = {
  slices,
  referentiel: 'cae',
};
