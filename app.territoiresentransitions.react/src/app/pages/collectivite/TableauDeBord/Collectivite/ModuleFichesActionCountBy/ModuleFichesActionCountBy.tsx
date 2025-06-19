import { useCurrentCollectivite } from '@/api/collectivites';
import { prioritesToState } from '@/app/app/pages/collectivite/PlansActions/components/BadgePriorite';
import { statutToColor } from '@/app/app/pages/collectivite/PlansActions/FicheAction/utils';
import ModalFichesActionCountByEdition, {
  countByPropertyOptions,
} from '@/app/app/pages/collectivite/TableauDeBord/Collectivite/ModuleFichesActionCountBy/ModalFichesActionCountByEdition';
import { useFichesActionCountBy } from '@/app/app/pages/collectivite/TableauDeBord/Collectivite/ModuleFichesActionCountBy/useFichesActionCountBy';
import { useCollectiviteModuleDelete } from '@/app/app/pages/collectivite/TableauDeBord/Collectivite/useCollectiviteModuleDelete';
import Module from '@/app/app/pages/collectivite/TableauDeBord/components/Module';
import { TDBViewParam } from '@/app/app/paths';
import { TFicheActionNiveauxPriorite } from '@/app/types/alias';
import { remToPx } from '@/app/ui/charts/echarts/remToPx';
import { useChartDownloader } from '@/app/ui/charts/useChartDownloader';
import PictoDocument from '@/app/ui/pictogrammes/PictoDocument';
import { ModuleFicheActionCountByType } from '@/domain/collectivites';
import { CountByPropertyEnumType, Statut } from '@/domain/plans/fiches';
import { Checkbox, Event, preset, useEventTracker } from '@/ui';
import { EChartsOption, PieSeriesOption } from 'echarts';
import { cloneDeep } from 'es-toolkit';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { ReactECharts } from '../../../../../../ui/charts/echarts';
import { makeFichesActionUrlWithParams } from './utils';

type Props = {
  view: TDBViewParam;
  module: ModuleFicheActionCountByType;
};

export const getItemColor = (
  countByProperty: CountByPropertyEnumType,
  value: string | number | boolean | null,
  nullColor: string
): string | null => {
  if (!value) {
    return nullColor;
  }
  if (countByProperty === 'statut') {
    return statutToColor[value as Statut];
  } else if (countByProperty === 'priorite') {
    const prioriteState =
      prioritesToState[value as TFicheActionNiveauxPriorite];
    return preset.theme.extend.colors[prioriteState][1];
  }
  return null;
};

/** Module pour afficher l'avancement des fiches action */
const ModuleFichesActionCountBy = ({ module }: Props) => {
  const { colors, fontSize, fontWeight } = preset.theme.extend;
  const { collectiviteId, niveauAcces } = useCurrentCollectivite();
  const router = useRouter();
  const { mutate: deleteCollectiviteModule } = useCollectiviteModuleDelete();
  const { mutate: download } = useChartDownloader();

  const [displayItemsLabel, setDisplayItemsLabel] = useState(false);

  const trackEvent = useEventTracker();

  const filtres = module.options.filtre;
  const countByProperty = module.options.countByProperty;

  const {
    data: countByResponse,
    isLoading,
    isError,
  } = useFichesActionCountBy(countByProperty, filtres);

  const getChartOption = useCallback(
    (displayItemsLabel: boolean): EChartsOption => {
      const pieChartData = countByResponse?.countByResult
        ? Object.entries(countByResponse.countByResult)
            .map(([key, { count, value, label }]) => {
              const itemColor = getItemColor(
                countByProperty,
                value,
                preset.theme.extend.colors.grey[4]
              );
              return {
                name: label || `${value}`,
                name_id: value,
                value: count,
                itemStyle: itemColor
                  ? {
                      color: itemColor,
                    }
                  : undefined,
              };
            })
            .filter((item) => item.value)
        : [];

      const pieChartSeries: PieSeriesOption = {
        name:
          countByPropertyOptions.find(
            (option) => option.value === module.options.countByProperty
          )?.label || module.options.countByProperty,
        type: 'pie',
        radius: ['40%', '80%'],
        avoidLabelOverlap: false,
        labelLine: {
          show: false,
        },
        label: {
          show: true,
          fontSize: `${remToPx(fontSize['base'])}px`,
          position: 'inside',
          formatter: '{c}',
        },
        emphasis: {
          label: { show: true },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        data: pieChartData,
      };

      const series: PieSeriesOption[] = [];
      if (displayItemsLabel) {
        // A bit a hack, but the way to have two labels: https://github.com/apache/echarts/issues/18383
        const itemlabelSeries: PieSeriesOption = cloneDeep(pieChartSeries);
        delete itemlabelSeries.emphasis;
        itemlabelSeries.label = {
          show: true,
          fontSize: `${remToPx(fontSize['base'])}px`,
          position: 'outside',
        };
        itemlabelSeries.labelLine = {
          show: true,
        };
        itemlabelSeries.avoidLabelOverlap = true;
        series.push(itemlabelSeries);
      }
      series.push(pieChartSeries);

      return {
        tooltip: {
          position: 'bottom',
          trigger: 'item',
          valueFormatter: (value) => {
            if (typeof value === 'number') {
              return `${value} (${((value / fichesCount) * 100).toFixed(0)}%)`;
            }
            return '';
          },
        },
        legend: {
          show: false,
        },
        title: {
          left: 'center',
          top: 'center',
          text: `${fichesCount}`,
          subtext: 'actions',
          itemGap: 0,
          textStyle: {
            color: colors.primary['9'],
            fontWeight: parseInt(fontWeight['bold']),
            fontSize: `${remToPx(fontSize['2xl'])}px`, // Better to set px instead of rem for SSR
          },
          subtextStyle: {
            color: colors.grey['6'],
            fontWeight: parseInt(fontWeight['normal']),
            fontSize: `${remToPx(fontSize['lg'])}px`, // Better to set px instead of rem for SSR
          },
        },
        series: series,
      };
    },
    [countByResponse, countByProperty]
  );

  const fichesCount = countByResponse?.total || 0;
  const sumCountBy = Object.values(countByResponse?.countByResult || {}).reduce(
    (acc, { count }) => acc + count,
    0
  );

  if (!collectiviteId) {
    return null;
  }

  return (
    <Module
      title={module.titre}
      titleTooltip={
        !isError && sumCountBy !== fichesCount
          ? 'Le total est inférieur à la somme des répartitions, car certaines fiches action peuvent se trouver dans plusieurs catégories à la fois.'
          : undefined
      }
      filtre={module.options.filtre}
      symbole={<PictoDocument className="w-16 h-16" />}
      onSettingsClick={() =>
        trackEvent(Event.tdb.updateFiltresCountByActions, {
          countByProperty: module.options.countByProperty,
        })
      }
      onDownloadClick={() => {
        const chartOptions = getChartOption(displayItemsLabel);
        chartOptions.backgroundColor = '#ffffff';
        download({
          format: 'png',
          name: module.titre,
          width: 900,
          height: 500,
          options: chartOptions,
        });
      }}
      onDeleteConfirmed={
        !module.defaultKey
          ? () => {
              deleteCollectiviteModule({
                collectiviteId,
                moduleId: module.id,
              });
            }
          : undefined
      }
      editModal={
        niveauAcces === 'admin'
          ? (openState) => (
              <ModalFichesActionCountByEdition
                module={module}
                openState={openState}
              />
            )
          : undefined
      }
      isLoading={isLoading}
      isEmpty={fichesCount === 0}
      isError={isError}
      className="!col-span-full xl:!col-span-4"
    >
      <div className="w-full h-full flex flex-col items-center justify-end">
        <ReactECharts
          heightRatio={0.75}
          onEvents={{
            click: ({ event }) => {
              // Event type is not typed in the library
              const dataId = (event as any).data?.name_id;
              const dataUrl = makeFichesActionUrlWithParams(
                collectiviteId,
                filtres,
                module.options.countByProperty,
                dataId
              );

              if (dataUrl) {
                router.push(dataUrl);
              } else {
                console.warn(
                  `click not supported for count by ${module.options.countByProperty} with value ${dataId}`
                );
              }
            },
          }}
          option={getChartOption(displayItemsLabel)}
        />
        <div className="w-full flex justify-start">
          {' '}
          <Checkbox
            variant="switch"
            checked={displayItemsLabel}
            label="Afficher la légende"
            labelClassname="text-sm text-grey-6"
            onChange={() => setDisplayItemsLabel(!displayItemsLabel)}
          />
        </div>
      </div>
    </Module>
  );
};

export default ModuleFichesActionCountBy;
