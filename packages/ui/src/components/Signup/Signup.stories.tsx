import {Meta, StoryObj} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {Signup} from './Signup';

const meta: Meta<typeof Signup> = {
  component: Signup,
  args: {
    collectivites: [
      {value: 1270, label: 'Grenoble'},
      {value: 5460, label: '#Collectivité Test'},
    ],
    onSubmit: action('onSubmit'),
    onCancel: action('onCancel'),
    onFilterCollectivites: action('onFilterCollectivites'),
  },
};

export default meta;

type Story = StoryObj<typeof Signup>;

export const Default: Story = {
  args: {
    defaultValues: {
      collectivite_id: 1270,
      email: 'yolo@dodo.com',
      cgu_acceptees: true,
      password: '',
    },
  },
};

export const Etape1AvecMdp: Story = {
  args: {
    withPassword: true,
    defaultView: 'etape1',
  },
};

export const SansSelectionCollectivite: Story = {
  args: {
    noCollectivite: true,
    defaultView: 'etape1',
  },
};

export const Etape2: Story = {
  args: {
    defaultView: 'etape2',
  },
};
