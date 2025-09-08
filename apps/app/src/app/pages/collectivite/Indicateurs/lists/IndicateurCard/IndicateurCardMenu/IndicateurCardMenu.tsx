import { useUpdateIndicateurDefinition } from '@/app/indicateurs/definitions/use-update-indicateur-definition';
import { ActionsMenu, MenuAction } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useMemo } from 'react';

export type ChartDownloadSettings = {
  showTrigger: boolean;
  openModal: () => void;
};

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
  const { mutate: updateIndicateur } =
    useUpdateIndicateurDefinition(indicateurId);

  const toggleEstFavori = (newValue: boolean) => {
    updateIndicateur({ estFavori: newValue });
    openState.setIsOpen(false);
  };

  const actions = useMemo<MenuAction[]>(() => {
    const menuActions: MenuAction[] = [];
    if (isFavoriCollectivite) {
      menuActions.push({
        label: 'Retirer des favoris',
        onClick: () => toggleEstFavori(false),
      });
    } else {
      menuActions.push({
        label: 'Ajouter aux favoris',
        onClick: () => toggleEstFavori(true),
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
