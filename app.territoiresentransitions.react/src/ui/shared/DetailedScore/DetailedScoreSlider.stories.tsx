import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {DetailedScoreSlider, TSliderProps} from './DetailedScoreSlider';

export default {
  component: DetailedScoreSlider,
} as Meta;

const Template: Story<TSliderProps> = args => (
  <div style={{width: 500, border: '1px dashed'}}>
    <DetailedScoreSlider {...args} />
  </div>
);

export const Exemple1 = Template.bind({});
Exemple1.args = {
  value: [0.3, 0.4, 0.3],
  onChange: action('onChange'),
};
