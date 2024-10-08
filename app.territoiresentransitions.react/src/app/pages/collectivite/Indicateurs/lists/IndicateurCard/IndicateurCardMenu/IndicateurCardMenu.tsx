import { ButtonMenu } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useUpdateIndicateurFavoriCollectivite } from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCardMenu/useUpdateIndicateurFavoriCollectivite';
import { useCollectiviteId } from 'core-logic/hooks/params';

export type ChartDownloadSettings = {
  showTrigger: boolean;
  openModal: () => void;
};

const buttonClassNames = 'p-3 text-sm text-left';

type Props = {
  indicateurId: number;
  openState: OpenState;
  chartDownloadSettings: ChartDownloadSettings;
  isFavoriCollectivite: boolean;
};

const IndicateurCardMenu = ({
  openState,
  isFavoriCollectivite,
  indicateurId,
  chartDownloadSettings,
}: Props) => {
  const collectiviteId = useCollectiviteId();
  const { mutate: toggleFavori } = useUpdateIndicateurFavoriCollectivite(
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
      <div className="w-64 flex flex-col divide-y divide-x-0 divide-solid divide-grey-3">
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
        {chartDownloadSettings.showTrigger && (
          <button
            className={buttonClassNames}
            onClick={() => {
              chartDownloadSettings.openModal();
              openState.setIsOpen(false);
            }}
          >
            Télécharger le graphique (.png)
          </button>
        )}
      </div>
    </ButtonMenu>
  );
};

export default IndicateurCardMenu;
