'use client';

import DonutChartWithLegend from '@components/charts/DonutChartWithLegend';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {Indicateurs} from 'app/collectivite/utils';
import {getFormattedNumber} from 'src/utils/getFormattedNumber';
import {IndicateurDefaultData} from './IndicateursCollectivite';
import {secteurIdToLabel} from 'src/utils/labels';
import Markdown from '@components/markdown/Markdown';

type IndicateurCardProps = {
  defaultData?: IndicateurDefaultData;
  data: Indicateurs[];
  graphTitle: string;
  unit?: string;
  unitSingular?: boolean;
};

/**
 * Affichage des données de la dernière année disponible
 * pour un indicateur donné
 */

const IndicateurCard = ({
  defaultData,
  data,
  graphTitle,
  unit,
  unitSingular,
}: IndicateurCardProps) => {
  if (!defaultData || data.length === 0) return null;

  const lastYear = Math.max(...data.map(d => d.annee));

  const lastYearData = data.filter(
    d => d.annee === lastYear && secteurIdToLabel[d.indicateur_id] !== 'Total',
  );

  const lastYearTotal = data.find(
    d => d.annee === lastYear && secteurIdToLabel[d.indicateur_id] === 'Total',
  );

  if (lastYearData.length <= 1 && !lastYearTotal) return null;

  return (
    <div className="flex flex-col bg-white md:rounded-[10px] py-10 px-8 lg:p-8">
      {/* Titre */}
      <h3 className="text-primary-10 mb-2">{defaultData.titre}</h3>

      {/* Description */}
      <p className="text-[12px] leading-[17px] text-grey-6 mb-0">
        {defaultData.description}
      </p>

      {/* Encadré */}
      <div className="flex gap-4 bg-primary-2 rounded-[10px] p-4 my-6">
        <StrapiImage
          data={defaultData.illustration_encadre}
          containerClassName="min-w-[70px]"
        />
        <div>
          <p className="text-[24px] leading-[39px] text-primary-10 font-bold mb-2">
            {`${
              lastYearTotal
                ? `${getFormattedNumber(Math.round(lastYearTotal?.valeur))} `
                : ''
            }${defaultData.titre_encadre}`}
          </p>
          <p className="text-[13px] leading-[18px] text-primary-8 font-bold mb-0">
            {defaultData.description_encadre}
          </p>
        </div>
      </div>

      {/* Détails */}
      {defaultData.details && (
        <Markdown
          texte={defaultData.details}
          className="text-primary-9 text-[14px] leading-[25px] font-[500px]"
        />
      )}

      {/* Graphe */}
      {lastYearData.length > 1 && (
        <>
          <p className="text-[12px] leading-[20px] text-grey-8 mb-0">{`${graphTitle} en ${lastYear}`}</p>
          <div className="mb-6">
            <DonutChartWithLegend
              graphContainerClassname="h-[300px] -mx-8"
              data={lastYearData.map(d => ({
                id: secteurIdToLabel[d.indicateur_id],
                value: d.valeur,
              }))}
              customMargin={{top: 40, right: 100, bottom: 40, left: 100}}
              unit={unit}
              unitSingular={unitSingular}
            />
          </div>

          <p className="text-[12px] leading-[17px] text-grey-6 mb-0">
            Source : {lastYearData[0].source}
          </p>
        </>
      )}
    </div>
  );
};

export default IndicateurCard;
