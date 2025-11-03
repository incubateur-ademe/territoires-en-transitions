import { Meta, StoryObj } from '@storybook/nextjs';
import { AdemeLogo } from '../../assets/ademe.logo';
import { RepubliqueFrancaiseLogo } from '../../assets/republique-francaise.logo';
import { TerritoiresEnTransitionsLogo } from '../../assets/territoires-en-transitions.logo';
import { Header } from './Header';

const meta: Meta<typeof Header> = {
  component: Header,
  args: {
    logos: [
      <RepubliqueFrancaiseLogo />,
      <AdemeLogo />,
      <TerritoiresEnTransitionsLogo />,
    ],
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
          icon: 'question-line',
          external: true,
        },
      ],
    },
    secondaryNav: [
      { href: '', children: 'Aide', icon: 'question-line', external: true },
      {
        children: 'Yolo Dodo',
        icon: 'account-circle-line',
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
