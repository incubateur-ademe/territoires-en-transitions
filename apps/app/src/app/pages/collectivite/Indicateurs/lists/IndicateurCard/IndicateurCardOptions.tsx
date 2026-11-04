import classNames from 'classnames';
import { Fragment, useState } from 'react';

import IndicateurCardMenu, {
  ChartDownloadSettings,
} from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCardMenu/IndicateurCardMenu';
import { appLabels } from '@/app/labels/catalog';
import {
  type IndicateurDetaille,
  isIndicateurPerso,
} from '@tet/domain/indicateurs';
import { DeleteIndicateurModal } from '@/app/indicateurs/indicateurs/delete-indicateur.modal';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, VisibleWhen } from '@tet/ui';
import IndicateurCardEditModal from './IndicateurCardEditModal';
import { getIndicateurMenuActions } from './menu-actions';

type Props = {
  definition: IndicateurDetaille;
  isEditable?: boolean;
  chartDownloadSettings: ChartDownloadSettings;
  isFavoriCollectivite?: boolean;
  otherMenuActions?: (indicateur: IndicateurDetaille) => React.ReactNode[];
};

const IndicateurCardOptions = ({
  definition,
  isEditable = true,
  isFavoriCollectivite = false,
  chartDownloadSettings,
  otherMenuActions,
}: Props) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { hasCollectivitePermission } = useCurrentCollectivite();

  const menuActions = getIndicateurMenuActions({
    isEditable,
    isFavoriCollectivite,
    isChartVisible: chartDownloadSettings.showTrigger,
    canDelete:
      isIndicateurPerso(definition) &&
      hasCollectivitePermission('indicateurs.indicateurs.delete'),
  }).filter((action) => action.isVisible);

  return (
    <div
      className={classNames('absolute top-4 right-4 flex items-center gap-2', {
        'invisible group-hover:visible':
          !isEditOpen && !isMenuOpen && !isDeleteOpen,
      })}
    >
      {otherMenuActions &&
        otherMenuActions(definition)?.map((action, i) => (
          <Fragment key={i}>{action}</Fragment>
        ))}

      <VisibleWhen condition={isEditable}>
        <Button
          title={appLabels.modifier}
          icon="edit-line"
          size="xs"
          variant="grey"
          onClick={() => {
            setIsEditOpen(!isEditOpen);
          }}
        />
        {isEditOpen && (
          <IndicateurCardEditModal
            indicateur={definition}
            openState={{
              isOpen: isEditOpen,
              setIsOpen: () => setIsEditOpen(!isEditOpen),
            }}
          />
        )}
      </VisibleWhen>
      <VisibleWhen condition={menuActions.length > 0}>
        <IndicateurCardMenu
          menuActions={menuActions}
          indicateurId={definition.id}
          chartDownloadSettings={chartDownloadSettings}
          onDelete={() => setIsDeleteOpen(true)}
          openState={{
            isOpen: isMenuOpen,
            setIsOpen: setIsMenuOpen,
          }}
        />
      </VisibleWhen>
      {isDeleteOpen && (
        <DeleteIndicateurModal
          definition={definition}
          redirectAfterDelete={false}
          openState={{ isOpen: true, setIsOpen: setIsDeleteOpen }}
        />
      )}
    </div>
  );
};

export default IndicateurCardOptions;
