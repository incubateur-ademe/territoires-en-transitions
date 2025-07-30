import {Meta, StoryObj} from '@storybook/nextjs';
import {action} from 'storybook/actions';
import {Tag} from './Tag';

const meta: Meta<typeof Tag> = {
  component: Tag,
  decorators: [story => <div className="flex">{story()}</div>],
};

export default meta;

type Story = StoryObj<typeof Tag>;

export const Default: Story = {
  args: {title: 'Yolo'},
};

export const AvecBoutonFermer: Story = {
  args: {title: 'Yolo', onClose: action('onClose')},
};

export const CreeParUtilisateur: Story = {
  args: {title: 'Yolo', isUserCreated: true, onClose: action('onClose')},
};

export const StylePersonnalise: Story = {
  args: {title: 'Yolo', className: '!bg-error-1 font-bold'},
};
