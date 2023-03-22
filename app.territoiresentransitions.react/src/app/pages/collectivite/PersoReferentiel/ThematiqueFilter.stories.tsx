import {Story, Meta} from '@storybook/react';
import {ThematiqueFilter, TThematiqueFilterProps} from './ThematiqueFilter';

export default {
  component: ThematiqueFilter,
} as Meta;

const Template: Story<TThematiqueFilterProps> = args => (
  <ThematiqueFilter {...args} />
);

export const SelectionVide = Template.bind({});
SelectionVide.args = {
  referentiels: [],
};

export const CAESeulement = Template.bind({});
CAESeulement.args = {
  referentiels: ['cae'],
};

export const ECISeulement = Template.bind({});
ECISeulement.args = {
  referentiels: ['eci'],
};

export const CAEEtECI = Template.bind({});
CAEEtECI.args = {
  referentiels: ['cae', 'eci'],
};
