import {Story, Meta} from '@storybook/react';
import {
  CritereActionTable,
  TCritereActionTableProps,
} from './CritereActionTable';
import fixture from './fixture.json';

export default {
  component: CritereActionTable,
} as Meta;

const Template: Story<TCritereActionTableProps> = args => (
  <CritereActionTable {...args} />
);

export const Exemple1 = Template.bind({});
Exemple1.args = fixture.parcours1.criteres[1];
