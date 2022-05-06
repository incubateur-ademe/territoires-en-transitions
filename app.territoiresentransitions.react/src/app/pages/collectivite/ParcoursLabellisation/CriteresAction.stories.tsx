import {Story, Meta} from '@storybook/react';
import {CriteresAction, TCriteresActionProps} from './CriteresAction';
import fixture from './fixture.json';

export default {
  component: CriteresAction,
} as Meta;

const Template: Story<TCriteresActionProps> = args => (
  <CriteresAction {...args} collectiviteId={1} />
);

export const Exemple1 = Template.bind({});
Exemple1.args = {parcours: fixture.parcours1};

export const Exemple2 = Template.bind({});
Exemple2.args = {parcours: fixture.parcours2};
