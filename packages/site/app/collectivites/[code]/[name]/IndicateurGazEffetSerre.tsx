import {Indicateurs} from 'app/collectivites/utils';
import {IndicateurDefaultData} from './IndicateursCollectivite';
import {secteurIdToLabel} from 'src/utils/labels';
import IndicateurCard from './IndicateurCard';
import {getFormattedNumber} from 'src/utils/getFormattedNumber';

type IndicateurGazEffetSerreProps = {
  defaultData?: IndicateurDefaultData;
  data: Indicateurs[] | null;
};

const IndicateurGazEffetSerre = ({
  defaultData,
  data,
}: IndicateurGazEffetSerreProps) => {
  if (!defaultData || !data || data.length === 0) return null;

  const lastYear = Math.max(...data.map(d => d.annee));

  const lastYearData = data.filter(
    d => d.annee === lastYear && secteurIdToLabel[d.indicateur_id] !== 'Total',
  );

  const lastYearTotal = data.find(
    d => d.annee === lastYear && secteurIdToLabel[d.indicateur_id] === 'Total',
  );

  if (lastYearData.length <= 1 && !lastYearTotal) return null;

  return (
    <IndicateurCard
      defaultData={defaultData}
      data={lastYearData.map(d => ({
        id: secteurIdToLabel[d.indicateur_id],
        value: d.valeur,
      }))}
      boxTitle={`${
        lastYearTotal
          ? `${getFormattedNumber(Math.round(lastYearTotal?.valeur))} `
          : ''
      }${defaultData.titre_encadre}`}
      graphTitle={`Répartition des émissions de gaz à effet de serre (hors puits) par secteur en ${lastYear}`}
      source={
        lastYearData.length ? lastYearData[0].source : lastYearTotal?.source
      }
      unit="t CO₂eq"
      unitSingular={true}
    />
  );
};

export default IndicateurGazEffetSerre;
