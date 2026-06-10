import { appLabels } from '@/app/labels/catalog';
import { useDuplicateFiche } from '@/app/plans/fiches/duplicate-fiche/data/use-duplicate-fiche';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ButtonMenu, Icon } from '@tet/ui';
import { useFicheContext } from '../../context/fiche-context';
import { useEditionModalManager } from '../context/edition-modal-manager-context';

export const Menu = () => {
  const { openModal } = useEditionModalManager();
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const { fiche, planId } = useFicheContext();
  const { mutate: duplicateFiche } = useDuplicateFiche({
    ficheId: fiche.id,
    invalidatePlanId: planId,
  });

  const actions: Array<{
    isVisible?: boolean;
    icon: string;
    label: string;
    variant?: 'destructive';
    onClick: () => void;
  }> = [
    {
      isVisible: hasCollectivitePermission('plans.mutate'),
      icon: 'folder-2-line',
      label: appLabels.mutualiserAction,
      onClick: () => openModal('emplacement'),
    },
    {
      isVisible: hasCollectivitePermission('plans.fiches.update'),
      icon: 'lock-line',
      label: appLabels.gererDroitsAcces,
      onClick: () => openModal('accessRightsManagement'),
    },
    {
      icon: 'download-line',
      label: appLabels.telechargerActionPdf,
      onClick: () => openModal('export'),
    },
    {
      icon: 'history-line',
      label: appLabels.journalActivite,
      isVisible: hasCollectivitePermission('collectivites.read'),
      onClick: () => openModal('activityLog'),
    },
    {
      isVisible: hasCollectivitePermission('plans.mutate'),
      icon: 'file-copy-line',
      label: appLabels.dupliquerLAction,
      onClick: () => duplicateFiche(),
    },
    {
      isVisible: hasCollectivitePermission('plans.fiches.delete'),
      icon: 'delete-bin-6-line',
      label: appLabels.supprimerAction,
      variant: 'destructive',
      onClick: () => openModal('deleting'),
    },
  ];

  const availableActions = actions
    .filter((action) => action.isVisible !== false)
    .map(({ isVisible, ...action }) => action);

  return (
    <ButtonMenu
      menu={{
        actions: availableActions,
      }}
      className="border-grey-4 border-solid border-2 py-4 px-2 w-9 h-9 rounded-lg flex items-center justify-center bg-white"
      variant="unstyled"
    >
      <Icon icon="more-line" size="sm" className="h-4 w-4 color-primary-9" />
    </ButtonMenu>
  );
};
