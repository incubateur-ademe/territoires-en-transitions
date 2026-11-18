'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import type { JSX } from 'react';

type Props = {
  label: string;
  isExpanded: boolean;
  onToggle: () => void;
};

export const SousIndicateurExpandToggle = ({
  label,
  isExpanded,
  onToggle,
}: Props): JSX.Element => {
  const actionLabel = isExpanded
    ? appLabels.indicateurSousIndicateurReplier({ label })
    : appLabels.indicateurSousIndicateurDeplier({ label });
  return (
    <Button
      variant="unstyled"
      size="xs"
      icon={isExpanded ? 'arrow-down-s-line' : 'arrow-right-s-line'}
      title={actionLabel}
      aria-label={actionLabel}
      aria-expanded={isExpanded}
      onClick={onToggle}
    />
  );
};
