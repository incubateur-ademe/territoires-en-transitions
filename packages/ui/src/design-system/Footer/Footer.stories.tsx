import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { APP_BASE_URL, SITE_BASE_URL } from '../../utils/constants';
import { Footer } from './Footer';

const meta: Meta<typeof Footer> = {
  component: Footer,
  args: {
    logos: [<i key="leaf" className="ri-leaf-line text-primary-9 !text-8xl" />],
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam eget maximus nisl, eget ullamcorper mauris. Nulla sagittis tempus leo nec elementum.',
    contentLinks: [
      {
        label: 'territoiresentransitions.fr',
        href: SITE_BASE_URL,
        external: true,
      },
    ],
    bottomContent: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    bottomLinks: [
      {
        label: 'Site',
        href: SITE_BASE_URL,
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
