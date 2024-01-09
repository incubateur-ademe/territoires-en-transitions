import {Meta, StoryObj} from '@storybook/react';
import {forwardRef} from 'react';

import {Modal} from './Modal';

const meta: Meta<typeof Modal> = {
  title: 'Design System/Modale',
  component: Modal,
  decorators: [story => <div className="p-8">{story()}</div>],
};

export default meta;

type Story = StoryObj<typeof Modal>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OpenButton = forwardRef((props: any, ref) => (
  <button
    {...props}
    ref={ref}
    className="min-w-[5rem] p-2 rounded-lg border border-solid border-grey-5"
  >
    {props.text ? props.text : 'Open'}
  </button>
));

export const Default: Story = {
  args: {
    textAlign: 'left',
    title: 'Un titre simple',
    subTitle: 'Un petit sous titre',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis magna, semper eget tortor sed, aliquet ornare risus. Sed egestas egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada viverra.',
  },
  render: args => {
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
    subTitle: 'Un petit sous titre',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis magna, semper eget tortor sed, aliquet ornare risus. Sed egestas egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada viverra. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis magna, semper eget tortor sed, aliquet ornare risus. Sed egestas egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada viverra. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis magna, semper eget tortor sed, aliquet ornare risus. Sed egestas egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada viverra. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis magna, semper eget tortor sed, aliquet ornare risus. Sed egestas egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada viverra. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis magna, semper eget tortor sed, aliquet ornare risus. Sed egestas egestas porttitor. Sed quis pretium eros. Mauris a turpis eu elit efficitur vehicula. Nulla ac vulputate velit. Nulla quis neque nec sapien molestie imperdiet. Cras viverra lacus vulputate diam malesuada viverra.',
  },
  render: args => {
    return (
      <Modal
        {...args}
        render={() => (
          <div className="flex flex-col p-8 border border-grey-5 text-grey-8 rounded-lg">
            <p>Contenu de la fonction "render" ici avec un petit bouton.</p>
            <p>Un autre paragraphe.</p>
            <button className="ml-auto p-2 text-white bg-primary-7 hover:!bg-primary-8 rounded-lg">
              Un bouton
            </button>
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
    subTitle: 'Un petit sous titre',
  },
  render: args => {
    return (
      <Modal
        {...args}
        render={() => (
          <div className="flex flex-col p-8 border border-grey-5 text-grey-8 rounded-lg">
            <p>Contenu de la fonction "render" ici avec un petit bouton.</p>
            <p>Un autre paragraphe.</p>
            <button className="ml-auto p-2 text-white bg-primary-7 hover:!bg-primary-8 rounded-lg">
              Un bouton
            </button>
          </div>
        )}
      >
        <OpenButton text="Ouvrir la modale" />
      </Modal>
    );
  },
};

export const onlyRender: Story = {
  args: {noCloseButton: true},
  render: args => {
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
  render: args => {
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
