import { Meta, StoryObj } from '@storybook/nextjs';
import { forwardRef, useState } from 'react';

import { Button } from '@/ui/design-system/Button';
import { ModalFooter } from '@/ui/design-system/Modal/ModalFooter';
import { Modal } from '.';

const meta: Meta<typeof Modal> = {
  component: Modal,
  decorators: [(story) => <div className="p-8">{story()}</div>],
};

export default meta;

type Story = StoryObj<typeof Modal>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OpenButton = forwardRef((props: any, ref) => (
  <Button {...props} ref={ref} variant="outlined">
    {props.text ? props.text : 'Open'}
  </Button>
));

export const Default: Story = {
  args: {
    textAlign: 'left',
    title: 'Un titre simple',
    subTitle: 'Un sous titre',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis magna, semper eget tortor sed, aliquet ornare risus. Sed egestas egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada viverra.',
  },
  render: (args) => {
    return (
      <Modal {...args}>
        <OpenButton text="Ouvrir la modale" />
      </Modal>
    );
  },
};

export const AvecBackdropBlur: Story = {
  ...Default,
  args: {
    ...Default.args,
    backdropBlur: true,
  },
};

export const AvecFooter: Story = {
  args: {
    textAlign: 'left',
    title: 'Un titre simple',
    subTitle: 'Un sous titre',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis magna, semper eget tortor sed, aliquet ornare risus. Sed egestas egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada viverra.',
    renderFooter: ({ close }) => (
      <ModalFooter>
        <Button onClick={close}>Fermer</Button>
      </ModalFooter>
    ),
  },
  render: (args) => {
    return (
      <Modal {...args}>
        <OpenButton text="Ouvrir la modale" />
      </Modal>
    );
  },
};

export const LongContent: Story = {
  args: {
    textAlign: 'left',
    title: 'Un titre simple',
    subTitle: 'Un sous titre',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis magna, semper eget tortor sed, aliquet ornare risus. Sed egestas egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada viverra. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis magna, semper eget tortor sed, aliquet ornare risus. Sed egestas egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada viverra. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis magna, semper eget tortor sed, aliquet ornare risus. Sed egestas egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada viverra. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis magna, semper eget tortor sed, aliquet ornare risus. Sed egestas egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada viverra. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis magna, semper eget tortor sed, aliquet ornare risus. Sed egestas egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada viverra.',
  },
  render: (args) => {
    return (
      <Modal
        {...args}
        render={({ close }) => (
          <div className="flex flex-col p-8 border border-grey-5 text-grey-8 rounded-lg">
            <p>Contenu de la fonction "render" ici avec un petit bouton.</p>
            <p>Un autre paragraphe.</p>
            <div className="flex gap-6 mt-2 ml-auto">
              <Button variant="grey" onClick={() => close()}>
                Annuler
              </Button>
              <Button>Valider</Button>
            </div>
          </div>
        )}
      >
        <OpenButton text="Ouvrir la modale" />
      </Modal>
    );
  },
};

export const WithRender: Story = {
  args: {
    title: 'Un titre simple',
    subTitle: 'Un sous titre',
  },
  render: (args) => {
    return (
      <Modal
        {...args}
        render={() => (
          <div className="flex flex-col p-8 border border-grey-5 text-grey-8 rounded-lg">
            <p>Contenu de la fonction "render" ici avec un petit bouton.</p>
            <p>Un autre paragraphe.</p>
            <Button className="ml-auto">Valider</Button>
          </div>
        )}
      >
        <OpenButton text="Ouvrir la modale" />
      </Modal>
    );
  },
};

export const onlyRender: Story = {
  args: { noCloseButton: true },
  render: (args) => {
    return (
      <Modal
        {...args}
        render={() => (
          <div className="p-8 border border-grey-5 text-grey-8 rounded-lg">
            <span>Contenu de la fonction "render" ici dans les bordures.</span>
          </div>
        )}
      >
        <OpenButton text="Ouvrir la modale" />
      </Modal>
    );
  },
};

export const Size: Story = {
  args: {
    textAlign: 'left',
    title: 'Un titre simple',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis magna, semper eget tortor sed, aliquet ornare risus. Sed egestas egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada viverra.',
  },
  render: (args) => {
    return (
      <div className="flex items-center gap-6">
        <Modal {...args} size="sm">
          <OpenButton text="sm" />
        </Modal>
        <Modal {...args} size="md">
          <OpenButton text="md" />
        </Modal>
        <Modal {...args} size="lg">
          <OpenButton text="lg" />
        </Modal>
        <Modal {...args} size="xl">
          <OpenButton text="xl" />
        </Modal>
      </div>
    );
  },
};

export const Controlled: Story = {
  args: {
    textAlign: 'left',
    title: 'Un titre simple',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis magna, semper eget tortor sed, aliquet ornare risus. Sed egestas egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada viverra.',
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Modal
          {...args}
          openState={{
            isOpen,
            setIsOpen,
          }}
        />
        <OpenButton onClick={() => setIsOpen(!isOpen)} />
      </>
    );
  },
};

export const WithFooterAlwaysVisible: Story = {
  args: {
    textAlign: 'left',
    title:
      'Une modale scrollable avec ses CTAs toujours visibles dans le footer',
    render: () => (
      <div className="flex flex-col p-8 border border-grey-5 text-grey-8 rounded-lg bg-slate-200">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis
          magna, semper eget tortor sed, aliquet ornare risus. Sed egestas
          egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit
          efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec
          sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada
          viverra.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis
          magna, semper eget tortor sed, aliquet ornare risus. Sed egestas
          egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit
          efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec
          sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada
          viverra.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis
          magna, semper eget tortor sed, aliquet ornare risus. Sed egestas
          egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit
          efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec
          sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada
          viverra.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis
          magna, semper eget tortor sed, aliquet ornare risus. Sed egestas
          egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit
          efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec
          sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada
          viverra.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis
          magna, semper eget tortor sed, aliquet ornare risus. Sed egestas
          egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit
          efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec
          sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada
          viverra.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis
          magna, semper eget tortor sed, aliquet ornare risus. Sed egestas
          egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit
          efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec
          sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada
          viverra.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis
          magna, semper eget tortor sed, aliquet ornare risus. Sed egestas
          egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit
          efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec
          sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada
          viverra.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis
          magna, semper eget tortor sed, aliquet ornare risus. Sed egestas
          egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit
          efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec
          sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada
          viverra.
        </p>
      </div>
    ),
    renderFooter: ({ close }) => (
      <ModalFooter>
        <Button onClick={close}>Fermer</Button>
        <Button onClick={close}>Valider</Button>
      </ModalFooter>
    ),
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Modal
          {...args}
          openState={{
            isOpen,
            setIsOpen,
          }}
          footerIsAlwaysVisible
        />
        <OpenButton onClick={() => setIsOpen(!isOpen)} />
      </>
    );
  },
};
