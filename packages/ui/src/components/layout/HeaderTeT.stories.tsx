import TeTeLogo from '@/ui/assets/TeTeLogo';
import { Button } from '@/ui/design-system/Button';
import { APP_BASE_URL, SITE_BASE_URL } from '@/ui/utils/constants';
import { Meta, StoryObj } from '@storybook/nextjs';
import { HeaderTeT } from './HeaderTeT';

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
    quickAccessButtons: (props) => [
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
        quickAccessButtons={(props) => [
          <Button
            {...props}
            key="outil"
            icon="seedling-line"
            href={`${SITE_BASE_URL}/outil-numerique`}
            iconPosition="left"
            external
          >
            Qui sommes-nous ?
          </Button>,
        ]}
      />
    </div>
  ),
};
