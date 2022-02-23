import {Story, Meta} from '@storybook/react';
// eslint-disable-next-line node/no-unpublished-import
// import {action} from '@storybook/addon-actions';
import {ActionPreuvePanel, TActionPreuvePanelProps} from './ActionPreuvePanel';

const DEFAULT_ARGS = {
  action: {id: 'eci_1.1.1'},
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
