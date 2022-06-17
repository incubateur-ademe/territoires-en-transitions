import {Story, Meta} from '@storybook/react';
import {MultiSelectColumn, TMultiSelectColumnProps} from './index';

export default {
  component: MultiSelectColumn,
} as Meta;

const Template: Story<TMultiSelectColumnProps> = args => (
  <MultiSelectColumn {...args} />
);

export const AucuneColonneMasquee = Template.bind({});
AucuneColonneMasquee.args = {
  label: 'Libellé',
  values: ['opt1', 'opt3', 'opt2'],
  items: [
    {separator: 'Séparateur 1'},
    {value: 'opt1', label: 'Option 1'},
    {value: 'opt2', label: 'Option 2'},
    {separator: 'Séparateur 2'},
    {value: 'opt3', label: 'Option 3'},
  ],
};
AucuneColonneMasquee.parameters = {storyshots: false};

export const UneColonneMasquee = Template.bind({});
UneColonneMasquee.args = {
  label: 'Libellé',
  values: ['opt1', 'opt3'],
  items: [
    {separator: 'Séparateur 1'},
    {value: 'opt1', label: 'Option 1'},
    {value: 'opt2', label: 'Option 2'},
    {separator: 'Séparateur 2'},
    {value: 'opt3', label: 'Option 3'},
  ],
};
UneColonneMasquee.parameters = {storyshots: false};

export const DeuxColonnesMasquees = Template.bind({});
DeuxColonnesMasquees.args = {
  label: 'Libellé',
  values: ['opt2'],
  items: [
    {separator: 'Séparateur 1'},
    {value: 'opt1', label: 'Option 1'},
    {value: 'opt2', label: 'Option 2'},
    {separator: 'Séparateur 2'},
    {value: 'opt3', label: 'Option 3'},
  ],
};
DeuxColonnesMasquees.parameters = {storyshots: false};

export const ToutesLesColonnesMasquées = Template.bind({});
ToutesLesColonnesMasquées.args = {
  label: 'Libellé',
  values: [],
  items: [
    {separator: 'Séparateur 1'},
    {value: 'opt1', label: 'Option 1'},
    {value: 'opt2', label: 'Option 2'},
    {separator: 'Séparateur 2'},
    {value: 'opt3', label: 'Option 3'},
  ],
};
ToutesLesColonnesMasquées.parameters = {storyshots: false};
