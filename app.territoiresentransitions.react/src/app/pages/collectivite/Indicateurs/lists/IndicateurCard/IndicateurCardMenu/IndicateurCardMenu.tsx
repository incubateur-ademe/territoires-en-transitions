import { useCollectiviteId } from '@/api/collectivites';
import { useUpdateIndicateurFavoriCollectivite } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCardMenu/useUpdateIndicateurFavoriCollectivite';
import { ActionsMenu, MenuAction } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useMemo } from 'react';

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

  const actions = useMemo<MenuAction[]>(() => {
    const menuActions: MenuAction[] = [];
    if (isFavoriCollectivite) {
      menuActions.push({
        label: 'Retirer des favoris',
        onClick: () => {
          toggleFavori(false);
          openState.setIsOpen(false);
        },
      });
    } else {
      menuActions.push({
        label: 'Ajouter aux favoris',
        onClick: () => {
          toggleFavori(true);
          openState.setIsOpen(false);
        },
      });
    }

    if (chartDownloadSettings.showTrigger) {
      menuActions.push({
        label: 'Télécharger le graphique (.png)',
        onClick: () => {
          chartDownloadSettings.openModal();
          openState.setIsOpen(false);
        },
      });
    }
    return menuActions;
  }, [isFavoriCollectivite, chartDownloadSettings.showTrigger]);

  return <ActionsMenu openState={openState} actions={actions} />;
};

export default IndicateurCardMenu;
