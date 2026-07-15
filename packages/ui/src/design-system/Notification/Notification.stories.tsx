import {Meta, StoryObj} from '@storybook/nextjs-vite';
import {Notification, NotificationSize, NotificationVariant} from '.';
import { RiLockFill } from '@remixicon/react';

const meta: Meta<typeof Notification> = {
  component: Notification,
};

export default meta;

type Story = StoryObj<typeof Notification>;

export const NombreUniquement: Story = {
  args: {number: 10},
};

export const IconeUniquement: Story = {
  args: {icon: <RiLockFill />},
};

export const NombreEtIcone: Story = {
  args: {number: 10, icon: <RiLockFill />},
};

export const Variantes: Story = {
  parameters: {},
  render: () => (
    <div
      className="grid gap-5 items-center bg-grey-2 p-10"
      style={{gridTemplateColumns: 'repeat(9,fit-content(0))'}}
    >
      {['md', 'sm', 'xs'].map(size =>
        [
          {number: 102, icon: <RiLockFill />},
          {number: 1},
          {icon: <RiLockFill />},
        ].map(config => (
          <div key={size} className="flex flex-col gap-5">
            {['default', 'warning', 'info', 'error'].map(variant => (
              <Notification
                key={variant}
                {...config}
                variant={variant as NotificationVariant}
                size={size as NotificationSize}
              />
            ))}
          </div>
        ))
      )}
    </div>
  ),
};
