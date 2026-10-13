'use client';

import { LAYERS } from '@/app/app/pages/collectivite/Trajectoire/graphes/layer-parameters';
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
      title={
        <span style={{ color: LAYERS[`${indicateurValeurType}s`].color }}>
          {FIELD_BADGE_TITLE[indicateurValeurType]}
        </span>
      }
      type="outlined"
    />
  </Tooltip>
);
