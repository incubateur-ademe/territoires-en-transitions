import {Meta, StoryObj} from '@storybook/nextjs-vite';
import {FooterTeT} from './FooterTeT';

const meta: Meta<typeof FooterTeT> = {
  title: 'Components/Layout/Footer TeT',
  component: FooterTeT,
};

export default meta;

type Story = StoryObj<typeof FooterTeT>;

export const Default: Story = {};
