import {Story, Meta} from '@storybook/react';
import {TFiltreProps} from './filters';
import {FiltreStatut} from './FiltreStatut';

export default {
  component: FiltreStatut,
} as Meta;

const Template: Story<TFiltreProps> = args => <FiltreStatut {...args} />;

export const All = Template.bind({});
All.args = {
  filters: {statut: ['tous']},
};

export const MultiSelect = Template.bind({});
MultiSelect.args = {
  filters: {statut: ['programme', 'fait']},
};
