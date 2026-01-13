import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { RadioButton } from './RadioButton';

const meta: Meta<typeof RadioButton> = {
  component: RadioButton,
};

export default meta;

type Story = StoryObj<typeof RadioButton>;

export const Unchecked: Story = {
  args: {
    label: 'Libellé'
  },
};

export const Checked: Story = {
  args: {
    checked: true,
    label: 'Libellé'
  },
};

export const Group = {
  render: () => <div className='flex gap-4'>
    <RadioButton name="reponse" value="true" label="Oui" checked />
    <RadioButton name="reponse" value="false" label="Non" />
  </div>
};
