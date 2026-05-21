import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ComponentProps, forwardRef, useState } from 'react';

import { Modal } from '.';
import { Button } from '../Button';
import { ModalFooter } from './ModalFooter';

const meta: Meta<typeof Modal> = {
  component: Modal,
  decorators: [(story) => <div className="p-8">{story()}</div>],
};

export default meta;

type Story = StoryObj<typeof Modal>;

const loremIpsum =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis magna, semper eget tortor sed, aliquet ornare risus. Sed egestas egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada viverra.';

const longLoremIpsum = loremIpsum.repeat(5);

const renderLorem = () => <p className="mb-0">{loremIpsum}</p>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OpenButton = forwardRef((props: any, ref) => (
  <Button {...props} ref={ref} variant="outlined">
    {props.text ? props.text : 'Open'}
  </Button>
));
OpenButton.displayName = 'OpenButton';

export const Default: Story = {
  args: {
    title: 'Un titre simple',
    subTitle: 'Un sous titre',
    render: renderLorem,
  },
  render: (args) => {
    return (
      <Modal {...args}>
        <OpenButton text="Ouvrir la modale" />
      </Modal>
    );
  },
};

export const TitreLong: Story = {
  args: {
    title:
      'Un titre particulièrement long qui doit passer sur plusieurs lignes pour vérifier le comportement du line-height du header de la modale',
    subTitle:
      'Un sous-titre lui aussi suffisamment long pour repasser à la ligne et confirmer que les hauteurs de ligne du titre et du sous-titre restent correctes',
    render: renderLorem,
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
    title: 'Un titre simple',
    subTitle: 'Un sous titre',
    render: renderLorem,
    renderFooter: ({ close }) => (
      <ModalFooter>
        <Button size="xs" onClick={close}>
          Fermer
        </Button>
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
    title: 'Un titre simple',
    subTitle: 'Un sous titre',
  },
  render: (args) => {
    return (
      <Modal
        {...args}
        render={({ close }) => (
          <div className="flex flex-col gap-4">
            <p className="mb-0">{longLoremIpsum}</p>
            <div className="flex gap-6 ml-auto">
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
            <p>
              Contenu de la fonction &quot;render&quot; ici avec un petit
              bouton.
            </p>
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
            <span>
              Contenu de la fonction &quot;render&quot; ici dans les bordures.
            </span>
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
    title: 'Un titre simple',
    render: renderLorem,
  },
  render: (args) => {
    return (
      <div className="flex items-center gap-6">
        <Modal {...args} size="xs">
          <OpenButton text="xs" />
        </Modal>
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

export const ScrollableContent: Story = {
  args: {
    title: 'Header et footer figés',
    subTitle: 'Le contenu défile entre les deux',
    scrollableContent: true,
    renderFooter: ({ close }) => (
      <ModalFooter>
        <Button size="xs" onClick={close}>
          Fermer
        </Button>
      </ModalFooter>
    ),
  },
  render: (args) => {
    return (
      <Modal
        {...args}
        render={() => <p className="mb-0">{longLoremIpsum}</p>}
      >
        <OpenButton text="Ouvrir la modale" />
      </Modal>
    );
  },
};

const RenderControlled = (args: ComponentProps<typeof Modal>) => {
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
};

export const Controlled: Story = {
  args: {
    title: 'Un titre simple',
    render: renderLorem,
  },
  render: (args) => <RenderControlled {...args} />,
};
