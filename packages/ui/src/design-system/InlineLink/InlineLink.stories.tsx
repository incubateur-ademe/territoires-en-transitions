import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { InlineLink } from './InlineLink';

const meta: Meta<typeof InlineLink> = {
  component: InlineLink,
  args: {
    href: '/',
    children: 'lien',
    className: 'text-primary-7',
  },
  render: (args: Story['args']) => (
    <div className="flex flex-col gap-2">
      <p className={args?.className}>
        On affiche un <InlineLink href="/" {...args} /> dans du texte qui
        s'adapte automatiquement à la couleur et à la taille de celui-ci.
      </p>
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof InlineLink>;

export const Default: Story = {};

export const OuvertureNouvelOnglet: Story = {
  args: {
    openInNewTab: true,
    className: 'text-error-1 text-xl',
  },
};
