import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {
  CritereActionTable,
  TCritereActionTableProps,
} from './CritereActionTable';
import fixture from './fixture.json';

export default {
  component: CritereActionTable,
} as Meta;

const Template: Story<TCritereActionTableProps> = args => (
  <CritereActionTable onClickRow={action('onClickRow')} {...args} />
);

export const Exemple1 = Template.bind({});
Exemple1.args = fixture.CritereLabellisationListeActions;
