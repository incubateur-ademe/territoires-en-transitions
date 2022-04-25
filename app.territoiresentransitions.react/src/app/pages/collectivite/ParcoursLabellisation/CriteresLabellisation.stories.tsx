import {Story, Meta} from '@storybook/react';
// import { action } from '@storybook/addon-actions';
import {
  CriteresLabellisation,
  TCriteresLabellisationProps,
} from './CriteresLabellisation';
import fixture from './fixture.json';

export default {
  component: CriteresLabellisation,
} as Meta;

const Template: Story<TCriteresLabellisationProps> = args => (
  <CriteresLabellisation {...args} />
);

export const PremiereEtoile = Template.bind({});
PremiereEtoile.args = {
  parcours: fixture.parcours1,
};
