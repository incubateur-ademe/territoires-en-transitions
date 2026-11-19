'use client';

import { appLabels } from '@/app/labels/catalog';
import { Icon } from '@tet/ui';
import Link from 'next/link';
import type { JSX } from 'react';

type Props = {
  label: string;
  href: string;
};

export const SousIndicateurOpenLink = ({ label, href }: Props): JSX.Element => (
  <Link
    className="flex rounded p-1 text-primary-9 hover:bg-grey-3"
    href={href}
    aria-label={appLabels.indicateurSousIndicateurOuvrir({ label })}
  >
    <Icon icon="arrow-right-s-line" size="sm" />
  </Link>
);
