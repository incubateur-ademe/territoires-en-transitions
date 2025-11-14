import classNames from 'classnames';
import { Fragment, useState } from 'react';

import IndicateurCardMenu, {
  ChartDownloadSettings,
} from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCardMenu/IndicateurCardMenu';
import { IndicateurDefinitionListItem } from '@/app/indicateurs/definitions/use-list-indicateur-definitions';
import { Button, VisibleWhen } from '@/ui';
import IndicateurCardEditModal from './IndicateurCardEditModal';

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
      <IndicateurCardMenu
        indicateurId={definition.id}
        isFavoriCollectivite={isFavoriCollectivite}
        chartDownloadSettings={chartDownloadSettings}
        isEditable={isEditable}
        openState={{
          isOpen: isMenuOpen,
          setIsOpen: () => setIsMenuOpen(!isMenuOpen),
        }}
      />
    </div>
  );
};

export default IndicateurCardOptions;
