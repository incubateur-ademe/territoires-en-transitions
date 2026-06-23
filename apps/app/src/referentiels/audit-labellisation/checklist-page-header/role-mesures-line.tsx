'use client';

import { appLabels } from '@/app/labels/catalog';
import { MetadataLine } from '@/app/ui/metadata-line';
import { RoleKey } from '@tet/domain/referentiels';
import { IconValue } from '@tet/ui';
import { ReactElement } from 'react';
import { RoleMesures } from '../checklist-view-model';
import { RoleMesureItem } from './role-mesure.item';

type RoleConfig = {
  key: RoleKey;
  icon: IconValue;
  label: (params: { count: number }) => string;
};

const ROLE_CONFIGS: RoleConfig[] = [
  {
    key: 'eluReferent',
    icon: 'government-line',
    label: appLabels.eluReferent,
  },
  {
    key: 'referentTechnique',
    icon: 'user-line',
    label: appLabels.referentTechnique,
  },
];

export const RoleMesuresLine = ({
  roleMesures,
}: {
  roleMesures: RoleMesures;
}): ReactElement | null => {
  const visibleRoles = ROLE_CONFIGS.map((config) => ({
    config,
    mesure: roleMesures[config.key],
  })).filter(
    (
      entry
    ): entry is {
      config: RoleConfig;
      mesure: NonNullable<typeof entry.mesure>;
    } => entry.mesure !== null
  );

  if (visibleRoles.length === 0) {
    return null;
  }

  return (
    <MetadataLine>
      {visibleRoles.map(({ config, mesure }, index) => (
        <RoleMesureItem
          key={config.key}
          actionId={mesure.actionId}
          icon={config.icon}
          label={config.label}
          hideSeparator={index === visibleRoles.length - 1}
        />
      ))}
    </MetadataLine>
  );
};
