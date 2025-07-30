import {StoryFn, Meta} from '@storybook/nextjs';
import {CriteresAction, TCriteresActionProps} from './CriteresAction';
import fixture from './fixture.json';

export default {
  component: CriteresAction,
} as Meta;

const Template: StoryFn<TCriteresActionProps> = args => (
  <CriteresAction {...args} collectiviteId={1} />
);

export const Exemple1 = {
  render: Template,
  args: {parcours: fixture.parcours1},
};

export const Exemple2 = {
  render: Template,
  args: {parcours: fixture.parcours2},
};
