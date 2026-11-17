import { appLabels } from '@/app/labels/catalog';
import { ActivityLogModal } from '@/app/ui/shared/activity-log.modal';
import { PermissionOperation } from '@tet/domain/users';
import { Button, ButtonMenu, cn, MenuAction, Tooltip } from '@tet/ui';
import { useState } from 'react';
import { DeleteIndicateurConfirmationModal } from '@/app/indicateurs/indicateurs/delete-indicateur-confirmation.modal';
import { IndicateurChartPngExport } from '../../chart/indicateur-chart.png-export';
import { IndicateurChartInfo } from '../../data/use-indicateur-chart';
import { useIndicateurActions } from '../context/indicateur-actions.context';
import { useIndicateurData } from '../context/indicateur-data.context';

type ModalType = 'activityLog' | 'deleting' | 'none';

type Props = {
  chartInfo?: IndicateurChartInfo;
  hasCollectivitePermission: (permission: PermissionOperation) => boolean;
  isPerso?: boolean;
  className?: string;
};

const IndicateurToolbar = ({
  chartInfo,
  hasCollectivitePermission,
  isPerso = false,
  className,
}: Props) => {
  const [currentModal, setCurrentModal] = useState<ModalType>('none');
  const [isExportingPng, setIsExportingPng] = useState(false);
  const closeModal = () => setCurrentModal('none');

  const { updateIndicateur, exportIndicateur, deleteIndicateur } =
    useIndicateurActions();

  const { indicateur } = useIndicateurData();
  const { estFavori } = indicateur;

  const actions: MenuAction[] = [
    {
      icon: 'download-line',
      label: appLabels.indicateurTelechargerExcel,
      onClick: exportIndicateur,
    },
    {
      isVisible: !!chartInfo?.hasValeur,
      icon: 'image-line',
      label: appLabels.telechargerLeGraphiquePng,
      onClick: () => setIsExportingPng(true),
    },
    {
      icon: 'history-line',
      label: appLabels.historique,
      isVisible: hasCollectivitePermission('collectivites.read'),
      onClick: () => setCurrentModal('activityLog'),
    },
    {
      isVisible:
        isPerso && hasCollectivitePermission('indicateurs.indicateurs.delete'),
      icon: 'delete-bin-6-line',
      label: appLabels.supprimerIndicateur,
      variant: 'destructive',
      onClick: () => setCurrentModal('deleting'),
    },
  ];

  return (
    <>
      <div className={cn('flex items-center gap-2', className)}>
        <Tooltip
          label={
            estFavori
              ? appLabels.indicateurRetirerFavoris
              : appLabels.indicateurAjouterFavoris
          }
        >
          <Button
            dataTest="IndicateurFavoriButton"
            icon={estFavori ? 'star-fill' : 'star-line'}
            size="xs"
            variant="grey"
            className={cn(estFavori && 'text-warning-1 hover:text-warning-1')}
            onClick={() => updateIndicateur({ estFavori: !estFavori })}
          />
        </Tooltip>

        <ButtonMenu
          dataTest="indicateurs.detail.menu"
          title={appLabels.indicateurOptions}
          icon="more-line"
          variant="grey"
          size="xs"
          menu={{ actions, className: 'max-w-none' }}
        />
      </div>

      {currentModal === 'activityLog' && (
        <ActivityLogModal
          modifiedAt={indicateur.modifiedAt}
          modifiedBy={indicateur.modifiedBy}
          onClose={closeModal}
        />
      )}

      {currentModal === 'deleting' && (
        <DeleteIndicateurConfirmationModal
          titre={indicateur.titre}
          openState={{ isOpen: true, setIsOpen: closeModal }}
          onConfirm={deleteIndicateur}
        />
      )}

      {isExportingPng && chartInfo && (
        <IndicateurChartPngExport
          chartInfo={chartInfo}
          title={indicateur.titre}
          onDone={() => setIsExportingPng(false)}
        />
      )}
    </>
  );
};

export default IndicateurToolbar;
