'use client';

import { appLabels } from '@/app/labels/catalog';
import { Badge, Tooltip } from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
import { JSX } from 'react';
import { PcaetIndicateurValeurType } from './types';

const FIELD_BADGE_TITLE: Record<PcaetIndicateurValeurType, string> = {
  resultat: 'R',
  objectif: 'O',
};

type Props = {
  indicateurValeurType: PcaetIndicateurValeurType;
};

export const IndicateurValeurTypeBadge = ({
  indicateurValeurType,
}: Props): JSX.Element => (
  <Tooltip
    label={
      indicateurValeurType === 'resultat'
        ? capitalize(appLabels.indicateurResultat())
        : capitalize(appLabels.indicateurObjectif())
    }
  >
    <Badge
      size="xs"
      title={FIELD_BADGE_TITLE[indicateurValeurType]}
      variant={indicateurValeurType === 'resultat' ? 'default' : 'standard'}
      type="outlined"
    />
  </Tooltip>
);
