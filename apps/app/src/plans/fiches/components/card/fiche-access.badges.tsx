import { appLabels } from '@/app/labels/catalog';
import {
  getFicheActionShareIcon,
  getFicheActionShareText,
} from '@/app/plans/fiches/share-fiche/fiche-share-info';
import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { Notification } from '@tet/ui';
import type { JSX } from 'react';

type FicheAccessBadgesProps = {
  readonly ficheAction: FicheShareProperties & {
    readonly restreint?: boolean | null;
  };
  readonly collectiviteId: number;
};

export const FicheAccessBadges = ({
  ficheAction,
  collectiviteId,
}: FicheAccessBadgesProps): JSX.Element | null => {
  const isRestricted = !!ficheAction.restreint;
  const isShared = !!ficheAction.sharedWithCollectivites?.length;

  if (!isRestricted && !isShared) {
    return null;
  }

  return (
    <div className="absolute -top-3 left-5 flex items-center gap-1">
      {isRestricted && (
        <div title={appLabels.actionAccesRestreint}>
          <Notification icon="lock-fill" size="xs" classname="w-7 h-7" />
        </div>
      )}
      {isShared && (
        <div title={getFicheActionShareText(ficheAction, collectiviteId)}>
          <Notification
            icon={getFicheActionShareIcon(ficheAction, collectiviteId)}
            variant="success"
            size="xs"
            classname="w-7 h-7"
          />
        </div>
      )}
    </div>
  );
};
