'use client';

import { Badge } from '@tet/ui';
import { JSX } from 'react';
import { ValeurField } from './types';

const FIELD_BADGE_TITLE: Record<ValeurField, string> = {
  resultat: 'R',
  objectif: 'O',
};

type ValueFieldBadgeProps = {
  field: ValeurField;
};

export const ValueFieldBadge = ({ field }: ValueFieldBadgeProps): JSX.Element => (
  <Badge
    size="xs"
    title={FIELD_BADGE_TITLE[field]}
    variant="default"
    type="outlined"
  />
);
