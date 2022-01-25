import {
  Footer,
  FooterDescription,
  FooterNavigation,
  FooterProps,
} from './Footer';

export default {
  component: Footer,
  args: {
    description: <FooterDescription />,
    navigation: <FooterNavigation />,
  },
};

export const Exemple = (args: FooterProps) => <Footer {...args} />;
