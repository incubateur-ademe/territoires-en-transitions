import {FooterTeT, SITE_BASE_URL} from '@tet/ui';

const Footer = () => {
  return (
    <FooterTeT
      customLinks={[
        {
          label: 'Statistiques',
          href: `${SITE_BASE_URL}/stats`,
        },
        {
          label: 'Budget',
          href: `${SITE_BASE_URL}/budget`,
        },
      ]}
    />
  );
};

export default Footer;
