import { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Icon } from '../Icon';
import { ButtonMenu, MenuSeparator } from './button-menu';
import { RiBugLine, RiDownloadLine, RiEditLine, RiInformationLine, RiMenu2Line, RiSeedlingLine, RiShapesLine } from '@remixicon/react';

const actions = [
  {
    icon: <RiEditLine />,
    label: "Éditer l'action",
    onClick: () => {
      console.log('Action 1');
    },
  },
  {
    icon: <RiDownloadLine />,
    label: 'Télécharger le document',
    onClick: () => {
      console.log('Action 2');
    },
  },
  {
    icon: <RiSeedlingLine />,
    label: 'Planter un arbre dans la forêt',
    onClick: () => console.log('Planter un arbre'),
  },
  {
    icon: <RiShapesLine />,
    label: 'Créer un module',
    onClick: () => console.log('Créer un module'),
  },
  {
    icon: <RiBugLine />,
    label: 'Signaler un bug',
    onClick: () => console.log('Signaler un bug'),
  },
];

const meta: Meta<typeof ButtonMenu> = {
  component: ButtonMenu,
  args: {
    icon: <RiMenu2Line />,
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
          <Icon icon={<RiInformationLine />} size="xs" className="text-[0.75rem]" />
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

export const WithSeparator: Story = {
  args: {
    menu: {
      className: 'max-w-none p-0',
      actions: [actions[0], MenuSeparator, actions[1]],
    },
  },
};
