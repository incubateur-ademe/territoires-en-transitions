import {Meta, StoryObj} from '@storybook/react';
import {Notification, NotificationSize, NotificationVariant} from '.';

const meta: Meta<typeof Notification> = {
  component: Notification,
};

export default meta;

type Story = StoryObj<typeof Notification>;

export const NombreUniquement: Story = {
  args: {number: 10},
};

export const IconeUniquement: Story = {
  args: {icon: 'lock-fill'},
};

export const NombreEtIcone: Story = {
  args: {number: 10, icon: 'lock-fill'},
};

export const Variantes: Story = {
  parameters: {},
  render: () => (
    <div
      className="grid gap-5 items-center bg-grey-2 p-10"
      style={{gridTemplateColumns: 'repeat(5,fit-content(0))'}}
    >
      {['md', 'sm', 'xs'].map(size => (
        <div key={size} className="flex flex-col gap-5">
          {['default', 'warning', 'info', 'error'].map(variant => (
            <Notification
              number={10}
              icon="lock-fill"
              variant={variant as NotificationVariant}
              size={size as NotificationSize}
            />
          ))}
        </div>
      ))}
    </div>
  ),
};
