import { IndicateurGes } from '@/site/app/collectivites/utils';
import { secteurIdToLabel, siteLabels } from '@/site/src/utils/labels';
import { toAnnualIndicateurYearFromHistoricalDate } from '@tet/domain/indicateurs';
import { getFormattedNumber } from '@tet/domain/utils';
import IndicateurCard from './IndicateurCard';
import { IndicateurDefaultData } from './IndicateursCollectivite';

const TOTAL_GES_IDENTIFIANT = 'cae_1.a';

const getYear = (indicateur: IndicateurGes): number =>
  toAnnualIndicateurYearFromHistoricalDate(
    indicateur.periodicite,
    indicateur.date_valeur,
    siteLabels.indicateurGesPublicationContexte(indicateur.identifiant)
  );

type IndicateurGazEffetSerreProps = {
  defaultData?: IndicateurDefaultData;
  data: IndicateurGes[] | null;
};

const IndicateurGazEffetSerre = ({
  defaultData,
  data,
}: IndicateurGazEffetSerreProps) => {
  if (!defaultData || !data || data.length === 0) return null;

  // Récupère les données de l'année la plus récente associées à la source CITEPA
  const lastYear = Math.max(...data.map(getYear));

  const lastYearData = data.filter(
    (d) =>
      getYear(d) === lastYear &&
      d.identifiant !== TOTAL_GES_IDENTIFIANT &&
      d.source === 'CITEPA'
  );

  // Récupère le total associé à cette année et à la source CITEPA
  const lastYearTotal = data.find(
    (d) =>
      getYear(d) === lastYear &&
      d.identifiant === TOTAL_GES_IDENTIFIANT &&
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
      graphTitle={siteLabels.indicateurGesRepartitionParSecteur(lastYear)}
      source={lastYearData?.[0].source ?? ''}
      unit={defaultData.titre_encadre}
      unitSingular={true}
      decimals={0}
    />
  );
};

export default IndicateurGazEffetSerre;
