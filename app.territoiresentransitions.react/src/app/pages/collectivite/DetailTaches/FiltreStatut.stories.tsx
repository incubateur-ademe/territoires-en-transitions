import {Story, Meta} from '@storybook/react';
// import { action } from '@storybook/addon-actions';
import {FiltreStatut, TFiltreStatutProps} from './FiltreStatut';

export default {
  component: FiltreStatut,
} as Meta;

const Template: Story<TFiltreStatutProps> = args => <FiltreStatut {...args} />;

export const All = Template.bind({});
All.args = {
  values: ['tous'],
};

export const MultiSelect = Template.bind({});
MultiSelect.args = {
  values: ['programme', 'fait'],
};
