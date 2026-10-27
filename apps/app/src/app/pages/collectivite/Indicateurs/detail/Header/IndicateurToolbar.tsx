import { appLabels } from '@/app/labels/catalog';
import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import { ActivityLogModal } from '@/app/ui/shared/activity-log.modal';
import { PermissionOperation } from '@tet/domain/users';
import { Button, ButtonMenu, MenuAction, Tooltip } from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';
import { DeleteIndicateurDefinitionModal } from '@/app/indicateurs/indicateurs/delete-indicateur-definition.modal';
import { IndicateurChartPngExport } from '../../chart/indicateur-chart.png-export';
import { IndicateurChartInfo } from '../../data/use-indicateur-chart';
import { useExportIndicateurs } from '../../Indicateur/useExportIndicateurs';

type ModalType = 'activityLog' | 'deleting' | 'none';

type Props = {
  definition: IndicateurDefinition;
  chartInfo?: IndicateurChartInfo;
  hasCollectivitePermission: (permission: PermissionOperation) => boolean;
  isPerso?: boolean;
  className?: string;
};

const IndicateurToolbar = ({
  definition,
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
    indicateurIds: [definition.id],
  });

  const { estFavori } = definition;

  const { mutate: updateIndicateur } = useUpdateIndicateur(definition.id);

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
          modifiedAt={definition.modifiedAt}
          modifiedBy={definition.modifiedBy}
          onClose={closeModal}
        />
      )}

      {currentModal === 'deleting' && (
        <DeleteIndicateurDefinitionModal
          definition={definition}
          openState={{ isOpen: true, setIsOpen: closeModal }}
        />
      )}

      {isExportingPng && chartInfo && (
        <IndicateurChartPngExport
          chartInfo={chartInfo}
          title={definition.titre}
          onDone={() => setIsExportingPng(false)}
        />
      )}
    </>
  );
};

export default IndicateurToolbar;
