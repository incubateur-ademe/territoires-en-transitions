import {Story, Meta} from '@storybook/react';
// import { action } from '@storybook/addon-actions';
import {CustomPointsTabs, TCustomPointsTabsProps} from './CustomPointsTabs';

export default {
  component: CustomPointsTabs,
} as Meta;

const Template: Story<TCustomPointsTabsProps> = args => (
  <CustomPointsTabs {...args} />
);

export const PersonnalisationDuPotentiel = Template.bind({});

export const Documentation = Template.bind({});
Documentation.args = {
  defaultActiveTab: 1,
};
