import { Indicateurs } from '@/site/app/collectivites/utils';
import { getFormattedNumber } from '@/site/src/utils/getFormattedNumber';
import { secteurIdToLabel } from '@/site/src/utils/labels';
import IndicateurCard from './IndicateurCard';
import { IndicateurDefaultData } from './IndicateursCollectivite';

const getYear = (dateIso: string) => new Date(dateIso).getFullYear();

type IndicateurGazEffetSerreProps = {
  defaultData?: IndicateurDefaultData;
  data: Indicateurs[] | null;
};

const IndicateurGazEffetSerre = ({
  defaultData,
  data,
}: IndicateurGazEffetSerreProps) => {
  if (!defaultData || !data || data.length === 0) return null;

  // Récupère les données de l'année la plus récente associées à la source CITEPA
  const lastYear = Math.max(...data.map((d) => getYear(d.date_valeur)));

  const lastYearData = data.filter(
    (d) =>
      getYear(d.date_valeur) === lastYear &&
      secteurIdToLabel[d.identifiant] !== 'Total' &&
      d.source === 'CITEPA'
  );

  // Récupère le total associé à cette année et à la source CITEPA
  const lastYearTotal = data.find(
    (d) =>
      getYear(d.date_valeur) === lastYear &&
      secteurIdToLabel[d.identifiant] === 'Total' &&
      d.source === 'CITEPA'
  );

  if (lastYearData.length <= 1 && !lastYearTotal) return null;

  return (
    <IndicateurCard
      defaultData={defaultData}
      data={lastYearData.map((d) => ({
        id: secteurIdToLabel[d.identifiant],
        value: d.resultat ?? 0,
      }))}
      boxTitle={`${
        lastYearTotal
          ? `${getFormattedNumber(Math.round(lastYearTotal.resultat ?? 0))} `
          : ''
      }${defaultData.titre_encadre}`}
      graphTitle={`Répartition des émissions de gaz à effet de serre (hors puits) par secteur en ${lastYear}`}
      source={lastYearData?.[0].source ?? ''}
      unit={defaultData.titre_encadre}
      unitSingular={true}
      decimals={0}
    />
  );
};

export default IndicateurGazEffetSerre;
