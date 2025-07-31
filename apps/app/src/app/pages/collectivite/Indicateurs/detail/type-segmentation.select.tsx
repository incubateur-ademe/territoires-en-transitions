import { Select } from '@/ui';
import {
  IndicateurChartInfo,
  SEGMENTATIONS,
} from '../data/use-indicateur-chart';

const SegmentationNames: Record<(typeof SEGMENTATIONS)[number], string> = {
  secteur: 'Indicateurs sectoriels',
  vecteur: 'Indicateurs vectoriels',
  vecteur_filiere: 'Indicateurs vecteur par filière',
  filiere: 'Indicateurs par filière',
  autre: 'Autres indicateurs',
};

export const TypeSegmentationSelect = ({
  chartInfo,
}: {
  chartInfo: IndicateurChartInfo;
}) => {
  const { typesSegmentation, segmentation, setSegmentation } =
    chartInfo;

  return (
    <Select
      values={segmentation}
      options={SEGMENTATIONS.filter((s) => typesSegmentation.includes(s)).map(
        (type) => ({
          label: SegmentationNames[type] || SegmentationNames.autre,
          value: type,
        })
      )}
      onChange={(v) => v && setSegmentation(v as string)}
    />
  );
};
