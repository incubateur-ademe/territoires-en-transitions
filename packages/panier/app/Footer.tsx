'use client';

import {FooterTeT} from '@tet/ui';
import {SITE_BASE_URL} from 'src/utils/constants';

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
