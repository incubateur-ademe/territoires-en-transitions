'use client';

import { Icon } from '@tet/ui';
import { JSX } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { RiClipboardLine } from '@remixicon/react';

export const GridLegend = (): JSX.Element => (
  <ul className="m-0 flex flex-wrap items-center gap-x-6 gap-y-1 p-0 list-none text-xs text-grey-7">
    <li className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-primary-7 ring-2 ring-primary-2" />
      {appLabels.indicateurLegendeOpenData}
    </li>
    <li className="flex items-center gap-2">
      <Icon icon={<RiClipboardLine />} size="sm" />
      {appLabels.indicateurLegendeCollage}
    </li>
  </ul>
);
