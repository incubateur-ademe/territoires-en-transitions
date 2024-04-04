import {FooterTeT, SITE_BASE_URL} from '@tet/ui';

const Footer = () => {
  return (
    <FooterTeT
      id="footer"
      className="mt-8"
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
