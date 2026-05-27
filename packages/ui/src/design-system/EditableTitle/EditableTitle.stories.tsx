import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { JSX, useState } from 'react';

import { EditableTitle, TITLE_MAX_LENGTH } from './EditableTitle';

const meta: Meta<typeof EditableTitle> = {
  component: EditableTitle,
  decorators: [
    (Story) => (
      <div className="p-8 max-w-3xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof EditableTitle>;

const ControlledEditableTitle = ({
  initialTitle,
  ...props
}: { initialTitle: string | null } & Omit<
  Parameters<typeof EditableTitle>[0],
  'title' | 'onUpdate'
>): JSX.Element => {
  const [title, setTitle] = useState<string | null>(initialTitle);
  return <EditableTitle {...props} title={title} onUpdate={setTitle} />;
};

export const Default: Story = {
  render: () => (
    <ControlledEditableTitle
      initialTitle="Plan climat air énergie territorial"
      isReadonly={false}
    />
  ),
};

export const SansTitre: Story = {
  render: () => (
    <ControlledEditableTitle initialTitle={null} isReadonly={false} />
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <ControlledEditableTitle
      initialTitle="Plan en lecture seule"
      isReadonly={true}
    />
  ),
};

export const PresqueALaLimite: Story = {
  render: () => (
    <ControlledEditableTitle
      initialTitle={'a'.repeat(TITLE_MAX_LENGTH - 5)}
      isReadonly={false}
    />
  ),
};

export const PlaceholderPersonnalise: Story = {
  render: () => (
    <ControlledEditableTitle
      initialTitle={null}
      isReadonly={false}
      placeholder="Saisir le nom de l'indicateur"
    />
  ),
};
