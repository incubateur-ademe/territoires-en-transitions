import classNames from 'classnames';
import { Fragment, useState } from 'react';

import IndicateurCardEdit from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCardEdit/IndicateurCardEdit';
import IndicateurCardMenu, {
  ChartDownloadSettings,
} from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCardMenu/IndicateurCardMenu';
import { TIndicateurListItem } from '@/app/app/pages/collectivite/Indicateurs/types';
import { Button } from '@/ui';

type Props = {
  definition: TIndicateurListItem;
  chartDownloadSettings: ChartDownloadSettings;
  isFavoriCollectivite?: boolean;
  otherMenuActions?: (indicateur: TIndicateurListItem) => React.ReactNode[];
};

const IndicateurCardOptions = ({
  definition,
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
        <IndicateurCardEdit
          definition={definition}
          openState={{
            isOpen: isEditOpen,
            setIsOpen: () => setIsEditOpen(!isEditOpen),
          }}
        />
      )}
      <IndicateurCardMenu
        indicateurId={definition.id}
        isFavoriCollectivite={isFavoriCollectivite}
        chartDownloadSettings={chartDownloadSettings}
        openState={{
          isOpen: isMenuOpen,
          setIsOpen: () => setIsMenuOpen(!isMenuOpen),
        }}
      />
    </div>
  );
};

export default IndicateurCardOptions;
