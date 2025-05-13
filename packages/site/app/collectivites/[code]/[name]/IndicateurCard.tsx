import DonutChartWithLegend from '@/site/components/charts/DonutChartWithLegend';
import Markdown from '@/site/components/markdown/Markdown';
import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import { IndicateurDefaultData } from './IndicateursCollectivite';

type IndicateurCardProps = {
  defaultData: IndicateurDefaultData;
  data: { id: string; value: number }[];
  boxTitle: string;
  graphTitle: string;
  source?: string;
  unit?: string;
  unitSingular?: boolean;
  decimals?: number;
};

/**
 * Affichage des données de la dernière année disponible
 * pour un indicateur donné
 */

const IndicateurCard = ({
  defaultData,
  data,
  boxTitle,
  graphTitle,
  source,
  unit,
  unitSingular,
  decimals,
}: IndicateurCardProps) => {
  return (
    <div className="flex flex-col bg-white md:rounded-[10px] py-10 px-8 lg:p-8 max-md:even:bg-primary-0">
      {/* Titre */}
      <h3 className="text-primary-10 mb-2">{defaultData.titre}</h3>

      {/* Description */}
      <p className="text-[12px] leading-[17px] text-grey-6 mb-0">
        {defaultData.description}
      </p>

      {/* Encadré */}
      <div className="flex gap-4 bg-primary-2 rounded-[10px] p-4 my-6">
        <DEPRECATED_StrapiImage
          data={defaultData.illustration_encadre}
          containerClassName="min-w-[70px] w-[70px]"
        />
        <div>
          <p className="text-[24px] leading-[39px] text-primary-10 font-bold mb-2">
            {boxTitle}
          </p>
          <p className="text-[13px] leading-[18px] text-primary-8 font-bold mb-0">
            {defaultData.description_encadre}
          </p>
        </div>
      </div>

      {/* Détails */}
      {!!defaultData.details && (
        <Markdown
          texte={defaultData.details}
          className="text-primary-9 text-[14px] leading-[25px] font-[500px]"
        />
      )}

      {/* Graphe */}
      {data.length > 1 && (
        <>
          <p className="text-[12px] leading-[20px] text-grey-8 mb-0">
            {graphTitle}
          </p>
          <div className="mb-6">
            <DonutChartWithLegend
              graphContainerClassname="h-[300px] -mx-8"
              data={data}
              customMargin={{ top: 40, right: 100, bottom: 40, left: 100 }}
              unit={unit}
              unitSingular={unitSingular}
              decimals={decimals}
              displayPercentageValue={true}
            />
          </div>
        </>
      )}

      {/* Source */}
      {!!source && (
        <p className="text-[12px] leading-[17px] text-grey-6 mb-0">
          Source : {source}
        </p>
      )}
    </div>
  );
};

export default IndicateurCard;
