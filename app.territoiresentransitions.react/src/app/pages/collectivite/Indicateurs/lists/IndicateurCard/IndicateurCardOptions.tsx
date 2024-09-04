import {useState} from 'react';
import classNames from 'classnames';

import {Button} from '@tet/ui';
import {TIndicateurListItem} from 'app/pages/collectivite/Indicateurs/types';
import IndicateurCardMenu, {
  ChartDownloadSettings,
} from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCardMenu/IndicateurCardMenu';
import IndicateurCardEdit from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCardEdit/IndicateurCardEdit';

type Props = {
  definition: TIndicateurListItem;
  chartDownloadSettings: ChartDownloadSettings;
  isFavoriCollectivite?: boolean;
};

const IndicateurCardOptions = ({
  definition,
  isFavoriCollectivite = false,
  chartDownloadSettings,
}: Props) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div
      className={classNames('absolute top-4 right-4 flex items-center gap-2', {
        'invisible group-hover:visible': !isEditOpen && !isMenuOpen,
      })}
    >
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
