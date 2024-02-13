import {Meta, StoryObj} from '@storybook/react';
import {HeaderTeT} from './HeaderTeT';
import TeTeLogo from '@assets/TeTeLogo';
import {Button} from '@design-system/Button';
import {APP_BASE_URL} from 'utils/constants';
import HeaderButton from '@design-system/Header/HeaderButton';

const meta: Meta<typeof HeaderTeT> = {
  title: 'Components/Layout/Header TeT',
  component: HeaderTeT,
};

export default meta;

type Story = StoryObj<typeof HeaderTeT>;

export const Default: Story = {};

export const HeaderApp: Story = {
  args: {
    menuButtons: props => [
      <HeaderButton {...props} isActive>
        Accueil
      </HeaderButton>,
      <HeaderButton {...props}>État des lieux</HeaderButton>,
    ],
  },
};

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
