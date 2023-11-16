import {IndicateurArtificialisation} from 'app/collectivites/utils';
import IndicateurCard from './IndicateurCard';
import {IndicateurDefaultData} from './IndicateursCollectivite';
import {getFormattedNumber} from 'src/utils/getFormattedNumber';
import {fluxToLabel} from 'src/utils/labels';

type IndicateurArtificialisationSolsProps = {
  defaultData?: IndicateurDefaultData;
  data: IndicateurArtificialisation | null;
};

const IndicateurArtificialisationSols = ({
  defaultData,
  data,
}: IndicateurArtificialisationSolsProps) => {
  if (!defaultData || !data || !data.total) return null;

  const localData = data as {[key: string]: number};

  if (!localData) return null;

  const formattedData = (Object.keys(localData) as Array<string>)
    .filter(d => d !== 'collectivite_id' && d !== 'total' && localData[d] !== 0)
    .map(d => ({
      id: fluxToLabel[d],
      value: localData[d],
    }));

  return (
    <IndicateurCard
      defaultData={defaultData}
      data={formattedData}
      boxTitle={`+${getFormattedNumber(Math.floor(data.total))} ${
        defaultData.titre_encadre
      }`}
      graphTitle="Répartition du flux de consommation d'espaces, par destination entre 2009 et 2022."
      source="Cerema, Consommation d'espaces naturels, agricoles et forestiers"
      unit="ha"
      unitSingular={true}
    />
  );
};

export default IndicateurArtificialisationSols;
