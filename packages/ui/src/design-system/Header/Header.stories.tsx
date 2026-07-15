import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Header } from './Header';
import { RiAccountCircleLine, RiQuestionLine } from '@remixicon/react';

const meta: Meta<typeof Header> = {
  component: Header,
  args: {
    mainNav: {
      startItems: [
        {
          children: 'Tableaux de bord',
          links: [
            { href: '', children: 'Lien 1' },
            { href: '', children: 'Lien 2 qui est très long et qui déborde' },
          ],
        },
        {
          children: "L'outil numérique",
          href: '',
          icon: <RiQuestionLine />,
          external: true,
        },
      ],
    },
    secondaryNav: [
      { href: '', children: 'Aide', icon: <RiQuestionLine />, external: true },
      {
        children: 'Yolo Dodo',
        icon: <RiAccountCircleLine />,
        links: [
          {
            href: '',
            children: 'Lien 1',
            disabled: true,
          },
          {
            href: '',
            children: "Centre d'aide et de partage",
            onClick: () => console.log('yolo'),
          },
        ],
      },
    ],
  },
};

export default meta;

type Story = StoryObj<typeof Header>;

export const Default: Story = {};
