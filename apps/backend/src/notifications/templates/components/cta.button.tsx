import { Button } from '@react-email/components';
import * as React from 'react';

export const CTAButton = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Button
    className="bg-primary text-white font-bold text-center inline-block py-3 px-6 rounded-lg"
    href={href}
  >
    {children}
  </Button>
);
