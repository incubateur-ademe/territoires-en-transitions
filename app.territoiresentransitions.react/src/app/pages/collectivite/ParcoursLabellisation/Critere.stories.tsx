import {Story, Meta} from '@storybook/react';
// import { action } from '@storybook/addon-actions';
import {Critere, TCritereProps} from './Critere';
import fixture from './fixture.json';

export default {
  component: Critere,
} as Meta;

const Template: Story<TCritereProps> = args => (
  <Critere parcours={fixture.parcours1} {...args} />
);

export const CritereSimple = Template.bind({});
CritereSimple.args = {
  critere: fixture.parcours1.criteres[0],
};

export const CritereSimpleRempli = Template.bind({});
CritereSimpleRempli.args = {
  critere: {...fixture.parcours1.criteres[0], rempli: true},
};

export const CritereAction = Template.bind({});
CritereAction.args = {
  critere: fixture.parcours1.criteres[1],
};

export const CritereActionRempli = Template.bind({});
CritereActionRempli.args = {
  critere: {
    ...fixture.parcours1.criteres[1],
    criteres: fixture.parcours1.criteres[1].criteres.map(c => ({
      ...c,
      rempli: true,
    })),
  },
};
