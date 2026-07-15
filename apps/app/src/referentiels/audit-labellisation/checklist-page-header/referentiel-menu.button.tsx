import { DownloadScoreModal } from '@/app/app/pages/collectivite/Referentiels/DownloadScore/download-score.modal';
import { SaveScoreModal } from '@/app/app/pages/collectivite/Referentiels/SaveScore/save-score.modal';
import { appLabels } from '@/app/labels/catalog';
import { useChecklist } from '@/app/referentiels/audit-labellisation/checklist.context';
import { isAuditActif } from '@/app/referentiels/audit-labellisation/checklist/is-audit-actif';
import { useArchivesPanel } from '@/app/referentiels/archives-panel/archives-panel.provider';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { ButtonMenu, MenuAction } from '@tet/ui';
import { ReactElement, useState } from 'react';
import { RiCameraLine, RiDownloadLine, RiFolderZipLine, RiMoreLine } from '@remixicon/react';

export const ReferentielMenuButton = ({
  referentielId,
  collectiviteId,
}: {
  referentielId: ReferentielId;
  collectiviteId: number;
}): ReactElement => {
  const { hasCollectivitePermission, nom: collectiviteNom } =
    useCurrentCollectivite();
  const canMutate = hasCollectivitePermission('referentiels.mutate');

  const { cycle } = useChecklist();
  const isAuditeur = cycle.isAuditeur;
  const auditActif = isAuditActif(cycle);
  const canAccessArchives = isAuditeur && auditActif;
  const { openPanel } = useArchivesPanel();

  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);

  const telechargerAction: MenuAction = {
    label: appLabels.telechargerEtatDesLieux,
    icon: <RiDownloadLine />,
    onClick: () => setIsDownloadOpen(true),
  };
  const figerAction: MenuAction = {
    label: appLabels.figerEtatDesLieux,
    icon: <RiCameraLine />,
    onClick: () => setIsSaveOpen(true),
  };
  const voirArchivesAction: MenuAction = {
    label: appLabels.preuvesTelechargementVoir,
    icon: <RiFolderZipLine />,
    onClick: () =>
      openPanel({
        collectiviteId,
        collectiviteNom,
        referentielId,
      }),
  };

  const menuActions: MenuAction[] = [
    telechargerAction,
    ...(canMutate ? [figerAction] : []),
    ...(canAccessArchives ? [voirArchivesAction] : []),
  ];

  return (
    <>
      <ButtonMenu
        title={appLabels.editerReferentiel}
        icon={<RiMoreLine />}
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
