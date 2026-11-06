import { appLabels } from '@/app/labels/catalog';
import { JSX } from 'react';

export const SousActionsRealiseesSkeleton = (): JSX.Element => (
  <p
    aria-hidden
    className="mb-0 animate-pulse select-none text-sm text-transparent"
    data-test="fiche.jauge.sous-actions-skeleton"
  >
    <span className="rounded-full box-decoration-clone bg-[linear-gradient(transparent_30%,theme(colors.grey.3)_30%,theme(colors.grey.3)_70%,transparent_70%)]">
      {appLabels.ficheJaugeSousActionsRealisees({ realisees: 0, total: 0 })}
    </span>
  </p>
);
