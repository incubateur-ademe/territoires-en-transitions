import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {DetailedScore, TDetailedScoreProps} from './DetailedScore';

export default {
  component: DetailedScore,
} as Meta;

const Template: Story<TDetailedScoreProps> = args => (
  <DetailedScore {...args} />
);

export const Exemple1 = Template.bind({});
Exemple1.args = {
  avancement: [0.3, 0.5, 0.2],
  onSave: action('onSave'),
};
