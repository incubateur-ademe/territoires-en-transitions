import { describe, expect, it } from 'vitest';
import { getIndicateurMenuActions } from './menu-actions';

describe('Indicateur card export action', () => {
  it.each([
    { isEditable: true, isChartVisible: true },
    { isEditable: true, isChartVisible: false },
    { isEditable: false, isChartVisible: true },
    { isEditable: false, isChartVisible: false },
  ])(
    'allows Excel export with isEditable=$isEditable and isChartVisible=$isChartVisible',
    ({ isEditable, isChartVisible }) => {
      const visibleActions = getIndicateurMenuActions({
        isEditable,
        isChartVisible,
        isFavoriCollectivite: false,
      }).filter((action) => action.isVisible);

      expect(visibleActions).toContainEqual({
        id: 'download-xlsx',
        label: 'Exporter au format .xlsx',
        isVisible: true,
      });
    }
  );
});
