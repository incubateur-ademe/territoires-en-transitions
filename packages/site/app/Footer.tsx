'use client';

import {usePathname} from 'next/navigation';
import {FooterTeT} from '@tet/ui';

const Footer = () => {
  const pathname = usePathname();

  return (
    <FooterTeT
      customLinks={
        pathname === '/outil-numerique'
          ? [
              {
                label: 'Budget',
                href: '/budget',
              },
            ]
          : []
      }
    />
  );
};

export default Footer;
