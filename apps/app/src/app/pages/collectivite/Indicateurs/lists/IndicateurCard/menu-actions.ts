export type IndicateurActionId =
  | 'remove-from-favorites'
  | 'add-to-favorites'
  | 'download-chart';

export type IndicateurMenuAction = {
  id: IndicateurActionId;
  label: string;
  isVisible: boolean;
};

export const getIndicateurMenuActions = (args: {
  isEditable: boolean;
  isFavoriCollectivite: boolean;
  isChartVisible: boolean;
}): IndicateurMenuAction[] => {
  const { isEditable, isFavoriCollectivite, isChartVisible } = args;
  return [
    {
      id: 'remove-from-favorites',
      label: 'Retirer des favoris',
      isVisible: isEditable && isFavoriCollectivite,
    },
    {
      id: 'add-to-favorites',
      label: 'Ajouter aux favoris',
      isVisible: isEditable && !isFavoriCollectivite,
    },
    {
      id: 'download-chart',
      label: 'Télécharger le graphique (.png)',
      isVisible: isChartVisible,
    },
  ];
};
