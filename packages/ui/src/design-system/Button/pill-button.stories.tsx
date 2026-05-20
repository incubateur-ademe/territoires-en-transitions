import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ReactElement, useState } from 'react';
import { PillButton } from './pill-button';

const meta: Meta<typeof PillButton> = {
  component: PillButton,
  argTypes: {
    icon: { control: { type: 'text' } },
    iconPosition: {
      control: { type: 'select' },
      options: ['left', 'right'],
    },
    isActive: { control: { type: 'boolean' } },
  },
};

export default meta;

type Story = StoryObj<typeof PillButton>;

export const Default: Story = {
  args: {
    children: 'Voir la mesure',
    icon: 'arrow-right-line',
  },
};

export const Active: Story = {
  args: {
    children: '3 documents',
    icon: 'layout-right-line',
    isActive: true,
  },
};

export const IconOnLeft: Story = {
  args: {
    children: 'Voir la liste',
    icon: 'list-check',
    iconPosition: 'left',
  },
};

export const States: Story = {
  render: () => (
    <div className="flex gap-4 p-6 bg-grey-1">
      <PillButton icon="arrow-right-line">Inactif</PillButton>
      <PillButton icon="layout-right-line" isActive>
        Actif
      </PillButton>
      <PillButton icon="list-check" iconPosition="left">
        Icône à gauche
      </PillButton>
      <PillButton icon="external-link-line">Sans état</PillButton>
    </div>
  ),
};

const ToggleDemo = (): ReactElement => {
  const [isActive, setIsActive] = useState(false);
  return (
    <PillButton
      icon="layout-right-line"
      isActive={isActive}
      onClick={() => setIsActive((prev) => !prev)}
    >
      {isActive ? 'Panneau ouvert' : 'Ouvrir le panneau'}
    </PillButton>
  );
};

export const Toggle: Story = {
  render: () => <ToggleDemo />,
};

export const AsLink: Story = {
  args: {
    children: 'Voir la mesure',
    icon: 'arrow-right-line',
    href: '#',
  },
};
