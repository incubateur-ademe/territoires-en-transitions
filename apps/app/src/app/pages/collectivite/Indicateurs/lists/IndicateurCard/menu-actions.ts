import { appLabels } from '@/app/labels/catalog';

type IndicateurActionId =
  | 'remove-from-favorites'
  | 'add-to-favorites'
  | 'download-xlsx'
  | 'download-chart'
  | 'delete';

export type IndicateurMenuAction = {
  id: IndicateurActionId;
  label: string;
  isVisible: boolean;
};

export const getIndicateurMenuActions = (args: {
  isEditable: boolean;
  isFavoriCollectivite: boolean;
  isChartVisible: boolean;
  canDelete: boolean;
}): IndicateurMenuAction[] => {
  const { isEditable, isFavoriCollectivite, isChartVisible, canDelete } = args;
  return [
    {
      id: 'remove-from-favorites',
      label: appLabels.retirerFavoris,
      isVisible: isEditable && isFavoriCollectivite,
    },
    {
      id: 'add-to-favorites',
      label: appLabels.ajouterFavoris,
      isVisible: isEditable && !isFavoriCollectivite,
    },
    {
      id: 'download-xlsx',
      label: appLabels.indicateurTelechargerExcel,
      isVisible: true,
    },
    {
      id: 'download-chart',
      label: appLabels.indicateurTelechargerGraphiquePng,
      isVisible: isChartVisible,
    },
    {
      id: 'delete',
      label: appLabels.supprimerIndicateur,
      isVisible: isEditable && canDelete,
    },
  ];
};
