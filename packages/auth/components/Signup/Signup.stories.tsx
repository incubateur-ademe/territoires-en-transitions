import { action } from 'storybook/actions';
import { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { Signup } from './Signup';
import { SignupView } from './type';

const meta: Meta<typeof Signup> = {
  component: Signup,
  args: {
    defaultValues: {
      email: 'yolo@dodo.com',
    },
    collectivites: [
      { value: 1270, label: 'Grenoble' },
      { value: 5460, label: '#Collectivité Test' },
    ],
    onSubmit: action('onSubmit'),
    onCancel: action('onCancel'),
    onFilterCollectivites: action('onFilterCollectivites'),
    getPasswordStrength: (...args) => {
      action('getPasswordStrength')(...args);
      return null;
    },
  },
  render: (props) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [view, setView] = useState<SignupView>(props.view || 'etape1');
    const onSetView: typeof setView = (...args) => {
      action('setView')(...args);
      setView(...args);
    };
    return <Signup {...props} view={view} setView={onSetView} />;
  },
};

export default meta;

type Story = StoryObj<typeof Signup>;

export const Default: Story = {
  args: {},
};

export const Etape2: Story = {
  args: {
    view: 'etape2',
  },
};

export const Etape2Erreur: Story = {
  args: { view: 'etape2', error: "Message d'erreur" },
};

export const Etape3: Story = {
  args: { view: 'etape3' },
};

export const Etape3Erreur: Story = {
  args: { view: 'etape3', error: "Message d'erreur" },
};
