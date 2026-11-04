import { appLabels } from '@/app/labels/catalog';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import { ActivityLogModal } from '@/app/ui/shared/activity-log.modal';
import { PermissionOperation } from '@tet/domain/users';
import { Button, ButtonMenu, MenuAction, Tooltip } from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';
import { DeleteIndicateurModal } from '@/app/indicateurs/indicateurs/delete-indicateur.modal';
import { IndicateurChartPngExport } from '../../chart/indicateur-chart.png-export';
import { IndicateurChartInfo } from '../../data/use-indicateur-chart';
import { useExportIndicateurs } from '../../Indicateur/useExportIndicateurs';

type ModalType = 'activityLog' | 'deleting' | 'none';

type Props = {
  indicateur: IndicateurDetaille;
  chartInfo?: IndicateurChartInfo;
  hasCollectivitePermission: (permission: PermissionOperation) => boolean;
  isPerso?: boolean;
  className?: string;
};

const IndicateurToolbar = ({
  indicateur,
  chartInfo,
  hasCollectivitePermission,
  isPerso = false,
  className,
}: Props) => {
  const [currentModal, setCurrentModal] = useState<ModalType>('none');
  const [isExportingPng, setIsExportingPng] = useState(false);
  const closeModal = () => setCurrentModal('none');

  const { mutate: exportIndicateurs } = useExportIndicateurs({
    mode: 'selection',
    indicateurIds: [indicateur.id],
  });

  const { estFavori } = indicateur;

  const { mutate: updateIndicateur } = useUpdateIndicateur(indicateur.id);

  const actions: MenuAction[] = [
    {
      icon: 'download-line',
      label: appLabels.indicateurTelechargerExcel,
      onClick: () => exportIndicateurs(),
    },
    {
      isVisible: !!chartInfo?.hasValeur,
      icon: 'image-line',
      label: appLabels.indicateurTelechargerGraphiquePng,
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
      <div className={classNames('flex items-center gap-2', className)}>
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
            className={classNames({
              'text-warning-1 hover:text-warning-1': estFavori,
            })}
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
        <DeleteIndicateurModal
          indicateur={indicateur}
          openState={{ isOpen: true, setIsOpen: closeModal }}
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
