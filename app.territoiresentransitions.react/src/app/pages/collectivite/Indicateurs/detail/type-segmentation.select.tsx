import { Select } from '@/ui';
import { IndicateurChartInfo } from '../data/use-indicateur-chart';

const SegmentationNames: Record<string, string> = {
  secteur: 'Indicateurs sectoriels',
  vecteur: 'Indicateurs vectoriels',
  vecteur_filiere: 'Indicateurs vecteur x filière',
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
      options={typesSegmentation.map((type) => ({
        label: SegmentationNames[type] || SegmentationNames.autre,
        value: type,
      }))}
      onChange={(v) => v && setSegmentation(v as string)}
    />
  );
};
