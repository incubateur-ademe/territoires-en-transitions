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
  selected: [],
};

export const CAESeulement = Template.bind({});
CAESeulement.args = {
  selected: ['cae'],
};

export const ECISeulement = Template.bind({});
ECISeulement.args = {
  selected: ['eci'],
};

export const CAEEtECI = Template.bind({});
CAEEtECI.args = {
  selected: ['cae', 'eci'],
};
