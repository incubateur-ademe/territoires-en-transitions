import {Meta, StoryObj} from '@storybook/react';
import {HeaderTeT} from './HeaderTeT';
import {Button} from '@design-system/Button';
import {APP_BASE_URL, BASE_URL} from 'utils/constants';
import TeTeLogo from '@assets/TeTeLogo';

const meta: Meta<typeof HeaderTeT> = {
  title: 'Components/Layout/Header TeT',
  component: HeaderTeT,
};

export default meta;

type Story = StoryObj<typeof HeaderTeT>;

export const Default: Story = {};

/** TODO */
export const HeaderApp: Story = {
  args: {},
};

/** TODO */
export const HeaderSite: Story = {
  args: {
    customLogos: [<TeTeLogo className="h-full" />],
    quickAccessButtons: props => [
      <Button
        {...props}
        icon="user-add-line"
        href={`${APP_BASE_URL}/auth/signup`}
      >
        Créer un compte
      </Button>,
      <Button {...props} icon="user-line" href={`${APP_BASE_URL}/auth/signin`}>
        Se connecter
      </Button>,
    ],
  },
};

export const HeaderPanier: Story = {
  render: () => (
    <div className="h-screen">
      <HeaderTeT
        quickAccessButtons={props => [
          <Button
            {...props}
            icon="seedling-line"
            href={`${BASE_URL}/outil-numerique`}
          >
            Qui sommes-nous ?
          </Button>,
          <Button
            {...props}
            icon="user-add-line"
            href={`${APP_BASE_URL}/auth/signup`}
          >
            Créer un compte
          </Button>,
          <Button
            {...props}
            icon="user-line"
            href={`${APP_BASE_URL}/auth/signin`}
          >
            Se connecter
          </Button>,
        ]}
      />
    </div>
  ),
};
