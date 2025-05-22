import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useFichesActionCountBy } from '@/app/plans-action/fiches/_data/use-fiches-action-count-by';
import Module from '@/app/tableaux-de-bord/modules/module/module';
import { getChartOption } from '@/app/tableaux-de-bord/plans-action/fiches-action-count-by/utils/get-chart-option';
import { makeFichesActionUrlWithParams } from '@/app/tableaux-de-bord/plans-action/fiches-action-count-by/utils/make-fiches-action-url-with-params';
import { ReactECharts } from '@/app/ui/charts/echarts';
import { useChartDownloader } from '@/app/ui/charts/useChartDownloader';
import PictoDocument from '@/app/ui/pictogrammes/PictoDocument';
import { ModuleFicheActionCountByType } from '@/domain/collectivites';
import { ButtonProps, Checkbox, MenuAction } from '@/ui';

type Props = {
  module: ModuleFicheActionCountByType;
  /** Actions disponnible dans le menu en haut à droite du module */
  menuActions?: {
    actions?: MenuAction[];
    enableDownload?: boolean;
  };
  /** Bouton à afficher dans l'état vide */
  emptyButtons?: ButtonProps[];
};

/** Module pour afficher le nombre de fiches action en fonctions de filtres spécifiques */
const FichesActionCountByModule = ({
  module,
  menuActions,
  emptyButtons,
}: Props) => {
  const router = useRouter();

  const { titre, options } = module;

  const countByProperty = module.options.countByProperty;

  const {
    data: countByResponse,
    isLoading,
    isError,
  } = useFichesActionCountBy(countByProperty, module.options.filtre);

  const countByTotal = countByResponse?.total || 0;
  const sumCountBy = Object.values(countByResponse?.countByResult || {}).reduce(
    (acc, { count }) => acc + count,
    0
  );

  const [displayItemsLabel, setDisplayItemsLabel] = useState(false);

  const chartOption = getChartOption({
    displayItemsLabel,
    countByProperty,
    countByTotal,
    countByResult: countByResponse?.countByResult,
  });

  const { mutate: download } = useChartDownloader();

  const getMenuActions = () => {
    const actions = [];
    if (menuActions?.actions) {
      actions.push(...menuActions.actions);
    }
    if (menuActions?.enableDownload) {
      actions.push({
        label: 'Télécharger',
        icon: 'download-line',
        onClick: () => {
          download({
            format: 'png',
            name: module.titre,
            width: 900,
            height: 500,
            options: { ...chartOption, backgroundColor: '#ffffff' },
          });
        },
      });
    }
    return actions;
  };

  return (
    <Module
      title={titre}
      titleTooltip={
        !isError && sumCountBy !== countByTotal
          ? 'Le total est inférieur à la somme des répartitions, car certaines fiches action peuvent se trouver dans plusieurs catégories à la fois.'
          : undefined
      }
      filters={options.filtre}
      symbole={<PictoDocument className="w-16 h-16" />}
      menuActions={getMenuActions()}
      isLoading={isLoading}
      isEmpty={countByTotal === 0}
      emptyButtons={emptyButtons}
      isError={isError}
      className="!col-span-full xl:!col-span-4"
    >
      <div className="w-full h-full flex flex-col items-center justify-end">
        <ReactECharts
          heightRatio={0.75}
          onEvents={{
            click: ({ event }) => {
              // Event type is not typed in the library
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const dataId = (event as any).data?.name_id;
              const dataUrl = makeFichesActionUrlWithParams(
                module.collectiviteId,
                options.filtre,
                options.countByProperty,
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
          option={chartOption}
        />
        <div className="w-full flex justify-start">
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

export default FichesActionCountByModule;
