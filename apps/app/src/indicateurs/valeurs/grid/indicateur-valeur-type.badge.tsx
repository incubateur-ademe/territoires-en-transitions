'use client';

import { appLabels } from '@/app/labels/catalog';
import { Badge, Tooltip } from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
import { JSX } from 'react';
import { IndicateurValeurField } from './types';

const FIELD_BADGE_TITLE: Record<IndicateurValeurField, string> = {
  resultat: 'R',
  objectif: 'O',
};

type Props = {
  indicateurValeurType: IndicateurValeurField;
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
