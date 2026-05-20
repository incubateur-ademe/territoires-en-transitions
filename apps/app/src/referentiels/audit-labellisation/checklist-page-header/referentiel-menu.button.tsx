import { DownloadScoreModal } from '@/app/app/pages/collectivite/Referentiels/DownloadScore/download-score.modal';
import { SaveScoreModal } from '@/app/app/pages/collectivite/Referentiels/SaveScore/save-score.modal';
import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { ButtonMenu, MenuAction } from '@tet/ui';
import { ReactElement, useState } from 'react';

export const ReferentielMenuButton = ({
  referentielId,
  collectiviteId,
}: {
  referentielId: ReferentielId;
  collectiviteId: number;
}): ReactElement => {
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const canMutate = hasCollectivitePermission('referentiels.mutate');

  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);

  const telechargerAction: MenuAction = {
    label: appLabels.telechargerEtatDesLieux,
    icon: 'download-line',
    onClick: () => setIsDownloadOpen(true),
  };
  const figerAction: MenuAction = {
    label: appLabels.figerEtatDesLieux,
    icon: 'camera-line',
    onClick: () => setIsSaveOpen(true),
  };

  const menuActions: MenuAction[] = canMutate
    ? [telechargerAction, figerAction]
    : [telechargerAction];

  return (
    <>
      <ButtonMenu
        title={appLabels.editerReferentiel}
        icon="more-line"
        variant="grey"
        size="xs"
        menu={{
          className: 'max-w-96',
          actions: menuActions,
        }}
      />
      {isDownloadOpen && (
        <DownloadScoreModal
          collectiviteId={collectiviteId}
          referentielId={referentielId}
          openState={{ isOpen: isDownloadOpen, setIsOpen: setIsDownloadOpen }}
        />
      )}
      {isSaveOpen && (
        <SaveScoreModal
          collectiviteId={collectiviteId}
          referentielId={referentielId}
          openState={{ isOpen: isSaveOpen, setIsOpen: setIsSaveOpen }}
          when="now"
        />
      )}
    </>
  );
};
