import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { ActionCard } from './action-card';

const meta: Meta<typeof ActionCard> = {
  component: ActionCard,
};

export default meta;

type Story = StoryObj<typeof ActionCard>;

const title = 'Aménager des aires de covoiturage';

const description =
  'Créer des aires de covoiturage aux entrées du territoire et les signaler.';

const content = (
  <>
    <span className="text-base font-bold text-primary-9">{title}</span>
    <span className="text-sm font-medium">{description}</span>
  </>
);

export const Default: Story = {
  args: {
    header: <Badge title="Action de référence" variant="warning" size="sm" />,
    children: content,
    footer: (
      <span className="text-xs font-normal">Modifié il y a une semaine</span>
    ),
  },
};

export const WithHoverActions: Story = {
  args: {
    ...Default.args,
    hoverActions: (
      <>
        <Button icon="edit-line" variant="grey" size="xs" title="Modifier" />
        <Button
          icon="delete-bin-line"
          variant="grey"
          size="xs"
          title="Supprimer"
        />
      </>
    ),
  },
};

export const AsLink: Story = {
  args: {
    ...WithHoverActions.args,
    href: '#',
  },
};

export const Clickable: Story = {
  args: {
    ...Default.args,
    onClick: fn(),
  },
};

export const Selected: Story = {
  args: {
    ...Default.args,
    isSelected: true,
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
};
