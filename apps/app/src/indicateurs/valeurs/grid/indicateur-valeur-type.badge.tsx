'use client';

import { appLabels } from '@/app/labels/catalog';
import { Badge, Tooltip } from '@tet/ui';
import { JSX } from 'react';
import { ValeurField } from './types';

const FIELD_BADGE_TITLE: Record<ValeurField, string> = {
  resultat: 'R',
  objectif: 'O',
};

type Props = {
  field: ValeurField;
};

export const IndicateurValueTypeBadge = ({ field }: Props): JSX.Element => (
  <Tooltip
    label={
      field === 'resultat'
        ? appLabels.indicateurLegendeResultat
        : appLabels.indicateurLegendeObjectif
    }
  >
    <Badge
      size="xs"
      title={FIELD_BADGE_TITLE[field]}
      variant={field === 'resultat' ? 'default' : 'standard'}
      type="outlined"
    />
  </Tooltip>
);
