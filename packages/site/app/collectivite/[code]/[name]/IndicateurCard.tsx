'use client';

import DonutChartWithLegend from '@components/charts/DonutChartWithLegend';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {Indicateurs} from 'app/collectivite/utils';
import {IndicateurDefaultData} from './IndicateursCollectivite';
import {secteurIdToLabel} from './labels';

type IndicateurCardProps = {
  defaultData?: IndicateurDefaultData;
  data: Indicateurs[];
  graphTitle: string;
  unit?: string;
  unitSingular?: boolean;
};

const IndicateurCard = ({
  defaultData,
  data,
  graphTitle,
  unit,
  unitSingular,
}: IndicateurCardProps) => {
  if (!defaultData || data.length === 0) return null;

  const year = data.reduce((lastYear, currValue) => {
    if (currValue.annee > lastYear) return currValue.annee;
    else return lastYear;
  }, 1900);

  const filteredData = data.filter(
    d => d.annee === year && secteurIdToLabel[d.indicateur_id] !== 'Total',
  );

  if (filteredData.length <= 1) return null;

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
            {defaultData.titre_encadre}
          </p>
          <p className="text-[13px] leading-[18px] text-primary-8 font-bold mb-0">
            {defaultData.description_encadre}
          </p>
        </div>
      </div>

      {/* Graphe */}
      <p className="text-[12px] leading-[20px] text-grey-8 mb-0">{`${graphTitle} en ${year}`}</p>
      <div className="mb-6">
        <DonutChartWithLegend
          graphContainerClassname="h-[300px] -mx-8"
          data={filteredData.map(d => ({
            id: secteurIdToLabel[d.indicateur_id],
            value: d.valeur,
          }))}
          customMargin={{top: 40, right: 100, bottom: 40, left: 100}}
          unit={unit}
          unitSingular={unitSingular}
        />
      </div>

      <p className="text-[12px] leading-[17px] text-grey-6 mb-0">
        Source : {filteredData[0].source}
      </p>
    </div>
  );
};

export default IndicateurCard;
