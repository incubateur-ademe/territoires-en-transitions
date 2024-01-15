import {Meta, StoryObj} from '@storybook/react';
import {Notif, NotifSize, NotifVariant} from './Notif';

const meta: Meta<typeof Notif> = {
  title: 'Design System/Notif',
  component: Notif,
};

export default meta;

type Story = StoryObj<typeof Notif>;

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
            <Notif
              number={10}
              icon="lock-fill"
              variant={variant as NotifVariant}
              size={size as NotifSize}
            />
          ))}
        </div>
      ))}
    </div>
  ),
};
