import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import { ActionId } from '@tet/domain/referentiels';
import { ButtonMenu } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { IndicateurMenuAction } from '../menu-actions';
export type ChartDownloadSettings = {
  showTrigger: boolean;
  openModal: () => void;
};

type Props = {
  indicateurId: number;
  openState: OpenState;
  chartDownloadSettings: ChartDownloadSettings;
  menuActions: IndicateurMenuAction[];
};

const IndicateurCardMenu = ({
  menuActions,
  openState,
  indicateurId,
  chartDownloadSettings,
}: Props) => {
  const { mutate: updateIndicateur } = useUpdateIndicateur(indicateurId);

  const toggleEstFavori = (newValue: boolean) => {
    updateIndicateur({ estFavori: newValue });
    openState.setIsOpen(false);
  };

  const onClickActions: Record<ActionId, () => void> = {
    'remove-from-favorites': () => toggleEstFavori(false),
    'add-to-favorites': () => toggleEstFavori(true),
    'download-chart': () => {
      chartDownloadSettings.openModal();
      openState.setIsOpen(false);
    },
  };

  const actions: Array<{ onClick: () => void; label: string }> =
    menuActions.map((action) => {
      return {
        label: action.label,
        onClick: onClickActions[action.id],
      };
    });

  return (
    <ButtonMenu
      icon="more-line"
      variant="grey"
      size="xs"
      menu={{
        actions,
        openState,
      }}
    />
  );
};

export default IndicateurCardMenu;
