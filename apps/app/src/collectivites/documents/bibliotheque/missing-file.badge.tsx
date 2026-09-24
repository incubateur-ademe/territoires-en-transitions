import { appLabels } from '@/app/labels/catalog';
import { Icon, Tooltip } from '@tet/ui';
import { ReactElement } from 'react';

export const MissingFileBadge = (): ReactElement => (
  <Tooltip label={appLabels.fichierIndisponibleInfo}>
    <div className="shrink-0">
      <Icon icon="error-warning-fill" size="sm" className="text-warning-1" />
      <span className="sr-only">{appLabels.fichierIndisponible}</span>
    </div>
  </Tooltip>
);
