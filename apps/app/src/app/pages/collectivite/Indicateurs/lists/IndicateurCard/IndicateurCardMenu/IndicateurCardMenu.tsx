import { useExportIndicateurs } from '@/app/app/pages/collectivite/Indicateurs/Indicateur/useExportIndicateurs';
import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import { ButtonMenu, MenuAction } from '@tet/ui';
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
  const { mutate: exportIndicateurs, isPending } = useExportIndicateurs({
    mode: 'selection',
    indicateurIds: [indicateurId],
  });

  const toggleEstFavori = (newValue: boolean) => {
    updateIndicateur({ estFavori: newValue });
    openState.setIsOpen(false);
  };

  const onClickActions: Record<IndicateurMenuAction['id'], () => void> = {
    'remove-from-favorites': () => toggleEstFavori(false),
    'add-to-favorites': () => toggleEstFavori(true),
    'download-xlsx': () => exportIndicateurs(),
    'download-chart': () => {
      chartDownloadSettings.openModal();
      openState.setIsOpen(false);
    },
  };

  const actions: MenuAction[] = menuActions.map((action) => ({
    label: action.label,
    onClick: onClickActions[action.id],
    disabled: action.id === 'download-xlsx' && isPending,
  }));

  return (
    <ButtonMenu
      dataTest="indicateurs.carte.menu"
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
