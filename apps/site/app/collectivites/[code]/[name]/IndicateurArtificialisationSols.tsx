import { IndicateurArtificialisation } from '@/site/app/collectivites/utils';
import { getFormattedNumber } from '@/site/src/utils/getFormattedNumber';
import { fluxToLabel } from '@/site/src/utils/labels';
import IndicateurCard from './IndicateurCard';
import { IndicateurDefaultData } from './IndicateursCollectivite';

type IndicateurArtificialisationSolsProps = {
  defaultData?: IndicateurDefaultData;
  data: IndicateurArtificialisation | null;
};

const getBoxTitle = (total: number, decimals: number, title: string) => {
  if (total === 0) return `0 ${title}`;
  else if (total > 0 && total < 1) return 'moins d’un hectare';
  else
    return `+${getFormattedNumber(
      Math.round(total * Math.pow(10, decimals)) / Math.pow(10, decimals)
    )} ${title}`;
};

const IndicateurArtificialisationSols = ({
  defaultData,
  data,
}: IndicateurArtificialisationSolsProps) => {
  const decimals = 2;

  if (!defaultData || !data || !data.total) return null;

  const localData = data as { [key: string]: number };

  if (!localData) return null;

  const formattedData = (Object.keys(localData) as Array<string>)
    .filter(
      (d) => d !== 'collectivite_id' && d !== 'total' && localData[d] !== 0
    )
    .map((d) => ({
      id: fluxToLabel[d],
      value: localData[d],
    }));

  return (
    <IndicateurCard
      defaultData={defaultData}
      data={formattedData}
      boxTitle={getBoxTitle(data.total, decimals, defaultData.titre_encadre)}
      graphTitle="Répartition du flux de consommation d'espaces, par destination entre 2009 et 2020."
      source="Cerema, Consommation d'espaces naturels, agricoles et forestiers"
      unit={defaultData.titre_encadre}
      unitSingular={true}
      decimals={decimals}
    />
  );
};

export default IndicateurArtificialisationSols;
