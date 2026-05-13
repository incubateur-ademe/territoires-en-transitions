import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Button } from '../Button';
import { AlertModal } from './AlertModal';

const meta: Meta<typeof AlertModal> = {
  component: AlertModal,
};

export default meta;

type Story = StoryObj<typeof AlertModal>;

const Demo = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Supprimer</Button>
      <AlertModal open={open} onOpenChange={setOpen}>
        <AlertModal.Header>
          <AlertModal.Title>Supprimer cet élément</AlertModal.Title>
          <AlertModal.Subtitle>Action irréversible</AlertModal.Subtitle>
        </AlertModal.Header>
        <AlertModal.Body>
          <AlertModal.Description>
            Êtes-vous sûr de vouloir supprimer cet élément ? Cette action ne peut pas être annulée.
          </AlertModal.Description>
        </AlertModal.Body>
        <AlertModal.Footer>
          <AlertModal.Cancel>Annuler</AlertModal.Cancel>
          <AlertModal.Action onClick={() => setOpen(false)}>Supprimer</AlertModal.Action>
        </AlertModal.Footer>
      </AlertModal>
    </>
  );
};

export const Default: Story = {
  render: () => <Demo />,
};
