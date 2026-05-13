import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Button } from '../Button';
import { Modal, ModalSize } from './Modal.next';

const meta: Meta<typeof Modal> = {
  component: Modal,
};

export default meta;

type Story = StoryObj<typeof Modal>;

const Demo = ({ size }: { size?: ModalSize }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Ouvrir la modale</Button>
      <Modal openState={{ isOpen, setIsOpen }} size={size}>
        <Modal.Header>
          <Modal.Title>Modifier le titre</Modal.Title>
          <Modal.Subtitle>Plan Climat Air Énergie territorial</Modal.Subtitle>
        </Modal.Header>
        <Modal.Body>
          <Modal.Description>
            Précisions optionnelles sur l&apos;action en cours.
          </Modal.Description>
          <p>Contenu libre dans le corps de la modale.</p>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Cancel>Annuler</Modal.Cancel>
          <Modal.Ok onClick={() => setIsOpen(false)}>Valider</Modal.Ok>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export const Uncontrolled: Story = {
  render: () => (
    <Modal>
      <Modal.Trigger>
        <Button>Ouvrir la modale</Button>
      </Modal.Trigger>
      <Modal.Header>
        <Modal.Title>Mode uncontrolled</Modal.Title>
        <Modal.Subtitle>Trigger gère l&apos;état interne</Modal.Subtitle>
      </Modal.Header>
      <Modal.Body>
        <p>Pas besoin de useState : le Trigger ouvre, Modal.Cancel ferme.</p>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Cancel>Fermer</Modal.Cancel>
      </Modal.Footer>
    </Modal>
  ),
};

export const ExtraSmall: Story = {
  render: () => <Demo size="xs" />,
};

export const Small: Story = {
  render: () => <Demo size="sm" />,
};

export const Medium: Story = {
  render: () => <Demo />,
};

export const Large: Story = {
  render: () => <Demo size="lg" />,
};

export const ExtraLarge: Story = {
  render: () => <Demo size="xl" />,
};

const LongContent = () => (
  <>
    {Array.from({ length: 40 }).map((_, index) => (
      <p key={index}>
        Paragraphe {index + 1} — Lorem ipsum dolor sit amet, consectetur
        adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris nisi ut aliquip ex ea commodo consequat.
      </p>
    ))}
  </>
);

export const WithScrollableBody: Story = {
  name: 'With scrollable body (header + footer fixes)',
  render: () => (
    <Modal>
      <Modal.Trigger>
        <Button>Ouvrir une modale longue</Button>
      </Modal.Trigger>
      <Modal.Header>
        <Modal.Title>En-tête fixe</Modal.Title>
        <Modal.Subtitle>
          Le body scrolle, header et footer restent visibles.
        </Modal.Subtitle>
      </Modal.Header>
      <Modal.Body>
        <LongContent />
      </Modal.Body>
      <Modal.Footer>
        <Modal.Cancel>Fermer</Modal.Cancel>
        <Modal.Ok>Valider</Modal.Ok>
      </Modal.Footer>
    </Modal>
  ),
};
