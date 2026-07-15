import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ReactElement, useState } from 'react';
import { PillButton } from './pill-button';
import { RiArrowRightLine, RiExternalLinkLine, RiLayoutRightLine, RiListCheck } from '@remixicon/react';

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
    icon: <RiArrowRightLine />,
  },
};

export const Active: Story = {
  args: {
    children: '3 documents',
    icon: <RiLayoutRightLine />,
    isActive: true,
  },
};

export const IconOnLeft: Story = {
  args: {
    children: 'Voir la liste',
    icon: <RiListCheck />,
    iconPosition: 'left',
  },
};

export const States: Story = {
  render: () => (
    <div className="flex gap-4 p-6 bg-grey-1">
      <PillButton icon={<RiArrowRightLine />}>Inactif</PillButton>
      <PillButton icon={<RiLayoutRightLine />} isActive>
        Actif
      </PillButton>
      <PillButton icon={<RiListCheck />} iconPosition="left">
        Icône à gauche
      </PillButton>
      <PillButton icon={<RiExternalLinkLine />}>Sans état</PillButton>
    </div>
  ),
};

const ToggleDemo = (): ReactElement => {
  const [isActive, setIsActive] = useState(false);
  return (
    <PillButton
      icon={<RiLayoutRightLine />}
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
    icon: <RiArrowRightLine />,
    href: '#',
  },
};
