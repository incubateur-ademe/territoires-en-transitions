import {Meta, StoryObj} from '@storybook/nextjs';
import {InfoTooltip} from './InfoTooltip';

const meta: Meta<typeof InfoTooltip> = {
  component: InfoTooltip,
};

export default meta;

type Story = StoryObj<typeof InfoTooltip>;

export const Default: Story = {
  render: () => (
    <div className="m-10">
      <InfoTooltip label="Message" />
    </div>
  ),
};

export const ActivatedByClick: Story = {
  render: () => (
    <div className="m-10">
      <InfoTooltip label="Message" activatedBy="click" placement="bottom" />
    </div>
  ),
};
