'use client';

import { FooterTeT } from '@tet/ui';
import { usePathname } from 'next/navigation';

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
