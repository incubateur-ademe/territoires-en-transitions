import { useUpdateIndicateurDefinition } from '@/app/indicateurs/definitions/use-update-indicateur-definition';
import { ButtonMenu, MenuAction } from '@/ui';
import { OpenState } from '@/ui/utils/types';
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
  const { mutate: updateIndicateur } =
    useUpdateIndicateurDefinition(indicateurId);

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
      openState={openState}
      actions={menuActions.filter((action) => action.isVisible)}
    />
  );
};

export default IndicateurCardMenu;
