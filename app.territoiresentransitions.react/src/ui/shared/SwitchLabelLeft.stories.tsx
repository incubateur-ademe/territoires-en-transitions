import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {SwitchLabelLeft, TSwitchLabelLeftProps} from './SwitchLabelLeft';

export default {
  component: SwitchLabelLeft,
} as Meta;

const common = {
  id: 'switch-1',
  children: 'Libellé',
  onChange: action('onChange'),
};

const Template: Story<TSwitchLabelLeftProps> = args => (
  <SwitchLabelLeft {...common} {...args} className="w-40" />
);

export const Unchecked = Template.bind({});
Unchecked.args = {
  checked: false,
};

export const Checked = Template.bind({});
Checked.args = {
  checked: true,
};
