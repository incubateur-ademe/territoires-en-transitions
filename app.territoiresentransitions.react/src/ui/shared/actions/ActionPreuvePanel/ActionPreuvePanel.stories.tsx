import {Story, Meta} from '@storybook/react';
import ActionPreuvePanel, {TActionPreuvePanelProps} from './ActionPreuvePanel';

const DEFAULT_ARGS = {
  action_id: 'eci_1.1.1',
  showWarning: true,
};

export default {
  component: ActionPreuvePanel,
  args: DEFAULT_ARGS,
} as Meta;

const Template: Story<TActionPreuvePanelProps> = args => (
  <ActionPreuvePanel {...args} />
);

export const Default = Template.bind({});
Default.args = {
  ...DEFAULT_ARGS,
};
