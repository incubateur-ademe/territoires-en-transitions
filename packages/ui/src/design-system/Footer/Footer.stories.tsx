import {Meta, StoryObj} from '@storybook/react';
import {Footer} from './Footer';
import LeafIcon from '@assets/LeafIcon';
import {APP_BASE_URL, BASE_URL} from 'utils/constants';

const meta: Meta<typeof Footer> = {
  title: 'Design System/Footer',
  component: Footer,
  args: {
    logos: [<LeafIcon className="text-primary-9 h-3/4" />],
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam eget maximus nisl, eget ullamcorper mauris. Nulla sagittis tempus leo nec elementum.',
    contentLinks: [
      {
        label: 'territoiresentransitions.fr',
        href: BASE_URL,
        external: true,
      },
    ],
    bottomContent: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    bottomLinks: [
      {
        label: 'Site',
        href: BASE_URL,
        external: true,
      },
      {
        label: 'Application',
        href: APP_BASE_URL,
        external: true,
      },
    ],
  },
};

export default meta;

type Story = StoryObj<typeof Footer>;

export const Default: Story = {};
