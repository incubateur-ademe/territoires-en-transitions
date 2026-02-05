import classNames from 'classnames';
import { Fragment, useState } from 'react';

import IndicateurCardMenu, {
  ChartDownloadSettings,
} from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCardMenu/IndicateurCardMenu';
import { IndicateurDefinitionListItem } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { Button, VisibleWhen } from '@tet/ui';
import IndicateurCardEditModal from './IndicateurCardEditModal';
import { getIndicateurMenuActions } from './menu-actions';

type Props = {
  definition: IndicateurDefinitionListItem;
  isEditable?: boolean;
  chartDownloadSettings: ChartDownloadSettings;
  isFavoriCollectivite?: boolean;
  otherMenuActions?: (
    indicateur: IndicateurDefinitionListItem
  ) => React.ReactNode[];
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

  const menuActions = getIndicateurMenuActions({
    isEditable,
    isFavoriCollectivite,
    isChartVisible: chartDownloadSettings.showTrigger,
  }).filter((action) => action.isVisible);

  return (
    <div
      className={classNames('absolute top-4 right-4 flex items-center gap-2', {
        'invisible group-hover:visible': !isEditOpen && !isMenuOpen,
      })}
    >
      {otherMenuActions &&
        otherMenuActions(definition)?.map((action, i) => (
          <Fragment key={i}>{action}</Fragment>
        ))}

      <VisibleWhen condition={isEditable}>
        <Button
          title="Modifier"
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
          openState={{
            isOpen: isMenuOpen,
            setIsOpen: () => setIsMenuOpen(!isMenuOpen),
          }}
        />
      </VisibleWhen>
    </div>
  );
};

export default IndicateurCardOptions;
