import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import { ButtonMenu, MenuAction } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
export type ChartDownloadSettings = {
  showTrigger: boolean;
  openModal: () => void;
};

type Props = {
  indicateurId: number;
  openState: OpenState;
  isEditable?: boolean;
  chartDownloadSettings: ChartDownloadSettings;
  isFavoriCollectivite: boolean;
};

const IndicateurCardMenu = ({
  openState,
  isFavoriCollectivite,
  isEditable,
  indicateurId,
  chartDownloadSettings,
}: Props) => {
  const { mutate: updateIndicateur } = useUpdateIndicateur(indicateurId);

  const toggleEstFavori = (newValue: boolean) => {
    updateIndicateur({ estFavori: newValue });
    openState.setIsOpen(false);
  };

  const menuActions: (MenuAction & { isVisible?: boolean })[] = [
    {
      label: 'Retirer des favoris',
      onClick: () => toggleEstFavori(false),
      isVisible: isEditable && isFavoriCollectivite,
    },
    {
      label: 'Ajouter aux favoris',
      onClick: () => toggleEstFavori(true),
      isVisible: isEditable && !isFavoriCollectivite,
    },
    {
      label: 'Télécharger le graphique (.png)',
      onClick: () => {
        chartDownloadSettings.openModal();
        openState.setIsOpen(false);
      },
      isVisible: chartDownloadSettings.showTrigger,
    },
  ];

  return (
    <ButtonMenu
      icon="more-line"
      variant="grey"
      size="xs"
      menu={{
        actions: menuActions,
        openState,
      }}
    />
  );
};

export default IndicateurCardMenu;
