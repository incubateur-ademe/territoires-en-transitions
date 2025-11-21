import { Meta, StoryObj } from '@storybook/nextjs';

import { Icon } from '../Icon';
import { ButtonMenu } from './button-menu';

const actions = [
  {
    icon: 'edit-line',
    label: "Éditer l'action",
    onClick: () => {
      console.log('Action 1');
    },
  },
  {
    icon: 'download-line',
    label: 'Télécharger le document',
    onClick: () => {
      console.log('Action 2');
    },
  },
  {
    icon: 'seedling-line',
    label: 'Planter un arbre dans la forêt',
    onClick: () => console.log('Planter un arbre'),
  },
  {
    icon: 'shapes-line',
    label: 'Créer un module',
    onClick: () => console.log('Créer un module'),
  },
  {
    icon: 'bug-line',
    label: 'Signaler un bug',
    onClick: () => console.log('Signaler un bug'),
  },
];

const meta: Meta<typeof ButtonMenu> = {
  component: ButtonMenu,
  args: {
    icon: 'menu-2-line',
    variant: 'grey',
    size: 'sm',
    menu: { actions },
  },
};

export default meta;

type Story = StoryObj<typeof ButtonMenu>;

export const Default: Story = {};

export const WithCustomContentAndActions: Story = {
  args: {
    icon: undefined,
    withArrow: true,
    children: 'Menu Button',
    menu: {
      actions: actions.map((a) =>
        a.label === 'Créer un module' ? { ...a, isVisible: false } : a
      ),
      startContent: (
        <div className="p-3 bg-primary-1 text-sm text-primary-7 rounded">
          Contenu personnalisé
        </div>
      ),
      endContent: (
        <div className="flex gap-1 px-2 text-grey-8 text-xs">
          <Icon icon="information-line" size="xs" className="text-[0.75rem]" />
          <span>Informations supplémentaires pour donner plus de contexte</span>
        </div>
      ),
    },
  },
};

export const OnlyCustomContent: Story = {
  args: {
    menu: {
      className: 'max-w-none p-0',
      startContent: (
        <div className="w-[50vw] h-96 p-8 bg-success-2 text-sm text-success-1 rounded">
          Contenu personnalisé seul
        </div>
      ),
    },
  },
};
