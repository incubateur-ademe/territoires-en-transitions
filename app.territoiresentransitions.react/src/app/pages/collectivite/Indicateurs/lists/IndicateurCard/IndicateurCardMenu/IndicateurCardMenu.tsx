import {ButtonMenu} from '@tet/ui';
import {OpenState} from '@tet/ui/dist/utils/types';
import {useUpdateIndicateurFavoriCollectivite} from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCardMenu/useUpdateIndicateurFavoriCollectivite';
import {useCollectiviteId} from 'core-logic/hooks/params';

const buttonClassNames = 'p-3 text-sm';

type Props = {
  indicateurId: number;
  openState: OpenState;
  isFavoriCollectivite: boolean;
};

const IndicateurCardMenu = ({
  openState,
  isFavoriCollectivite,
  indicateurId,
}: Props) => {
  const collectiviteId = useCollectiviteId();
  const {mutate: toggleFavori} = useUpdateIndicateurFavoriCollectivite(
    collectiviteId!,
    indicateurId
  );
  return (
    <ButtonMenu
      openState={openState}
      icon="more-line"
      size="xs"
      variant="grey"
      title="Ouvrir le menu"
    >
      {isFavoriCollectivite ? (
        <button
          className={buttonClassNames}
          onClick={() => {
            toggleFavori(false);
            openState.setIsOpen(false);
          }}
        >
          Retirer de ma collectivité
        </button>
      ) : (
        <button
          className={buttonClassNames}
          onClick={() => {
            toggleFavori(true);
            openState.setIsOpen(false);
          }}
        >
          Ajouter à ma collectivité
        </button>
      )}
    </ButtonMenu>
  );
};

export default IndicateurCardMenu;
