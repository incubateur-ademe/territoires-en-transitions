import {useState} from 'react';
import classNames from 'classnames';

import {TIndicateurListItem} from 'app/pages/collectivite/Indicateurs/types';
import IndicateurCardMenu from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCardMenu/IndicateurCardMenu';

type Props = {
  definition: TIndicateurListItem;
  isFavoriCollectivite?: boolean;
};

const IndicateurCardOptions = ({
  definition,
  isFavoriCollectivite = false,
}: Props) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <div
      className={classNames('absolute top-4 right-4 flex items-center gap-2', {
        'invisible group-hover:visible': !isMenuOpen,
      })}
    >
      <IndicateurCardMenu
        indicateurId={definition.id}
        isFavoriCollectivite={isFavoriCollectivite}
        openState={{
          isOpen: isMenuOpen,
          setIsOpen: () => setIsMenuOpen(!isMenuOpen),
        }}
      />
    </div>
  );
};

export default IndicateurCardOptions;
