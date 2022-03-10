import {Story, Meta} from '@storybook/react';
import {StatisticsPage, TStatisticsPageProps} from './StatisticsPage';
import fixture from './fixture.json';

export default {
  component: StatisticsPage,
} as Meta;

const Template: Story<TStatisticsPageProps> = args => (
  <StatisticsPage {...args} />
);

export const Exemple1 = Template.bind({});
Exemple1.args = {
  ...fixture,
};
