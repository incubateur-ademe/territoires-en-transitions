import {Meta, StoryObj} from '@storybook/nextjs-vite';
import {action} from 'storybook/actions';
import {Badge, BadgeState} from './index';

const meta: Meta<typeof Badge> = {
  component: Badge,
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {title: 'Badge'},
};

export const CustomIcon: Story = {
  args: {title: 'Badge', icon: 'alert-fill', onClose: () => null},
};

export const Grid: Story = {
  args: {title: 'Badge'},
  render: args => {
    const states: BadgeState[] = [
      'default',
      'standard',
      'success',
      'warning',
      'new',
      'error',
      'info',
      'grey',
    ];
    return (
      <div className="flex gap-16 flex-wrap">
        {states.map(state => (
          <div key={state} className="col-span-1 flex flex-col gap-4">
            <div className="capitalize text-sm font-medium">{state}</div>
            <Badge {...args} state={state} />
            <Badge {...args} state={state} onClose={action('onClose')} light />
            <Badge
              {...args}
              state={state}
              size="sm"
              onClose={action('onClose')}
              iconPosition="left"
            />
            <Badge
              {...args}
              state={state}
              disabled
              onClose={action('onClose')}
            />
            <Badge
              {...args}
              state={state}
              onClose={action('onClose')}
              disabled
              light
            />
          </div>
        ))}
      </div>
    );
  },
};
