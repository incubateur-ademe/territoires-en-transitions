import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useFichesCountBy } from '@/app/plans/fiches/data/use-fiches-count-by';
import Module from '@/app/tableaux-de-bord/modules/module/module';
import { getChartOption } from '@/app/tableaux-de-bord/plans-action/fiches-action-count-by/utils/get-chart-option';
import { ReactECharts } from '@/app/ui/charts/echarts';
import { useChartDownloader } from '@/app/ui/charts/useChartDownloader';
import PictoDocument from '@/app/ui/pictogrammes/PictoDocument';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  ModuleFicheCountByProperty,
  ModuleFicheCountFilters,
} from '@tet/domain/collectivites/tableau-de-bord';
import { ButtonProps, Checkbox, MenuAction } from '@tet/ui';

import { makeFichesActionUrlWithParams } from './utils/make-fiches-action-url-with-params';

/** Le module n'est pas passé en entier car utilisé dans
 * le tableau de bord synthétique où nous n'avons pas d'informations
 * car il n'est pas enregistré en base */

type Props = {
  /** Titre du module */
  titre: string;
  /** Propriété sur laquelle se base le comptage */
  countByProperty: ModuleFicheCountByProperty;
  /** Filtres de la requête */
  filters?: ModuleFicheCountFilters;
  /** Actions disponnible dans le menu en haut à droite du module */
  menuActions?: {
    actions?: MenuAction[];
  };
  /** Bouton à afficher dans l'état vide */
  emptyButtons?: ButtonProps[];
  /** Bouton à afficher dans l'état erreur */
  errorButtons?: ButtonProps[];
};

/** Module pour afficher le nombre de fiches action en fonctions de filtres spécifiques */
export const FichesActionCountByModule = ({
  titre,
  countByProperty,
  filters = {},
  menuActions,
  emptyButtons,
  errorButtons,
}: Props) => {
  const router = useRouter();
  const collectiviteId = useCollectiviteId();

  const {
    data: countByResponse,
    isLoading,
    isError,
  } = useFichesCountBy(countByProperty, filters);

  const countByTotal = countByResponse?.total || 0;
  const sumCountBy = Object.values(countByResponse?.countByResult || {}).reduce(
    (acc, { count }) => acc + count,
    0
  );

  const [displayItemsLabel, setDisplayItemsLabel] = useState(false);

  const chartOption = getChartOption({
    getCursorOnHover: (args) => {
      const dataUrl = makeFichesActionUrlWithParams(
        collectiviteId,
        filters ?? {},
        args.countByProperty,
        args.value
      );
      return dataUrl === null ? 'not-allowed' : 'pointer';
    },
    displayItemsLabel,
    countByProperty,
    countByTotal,
    countByResult: countByResponse?.countByResult,
  });

  const { mutate: download } = useChartDownloader();

  const getMenuActions = () => {
    const actions = [
      ...(menuActions?.actions ?? []),

      {
        label: 'Télécharger',
        icon: 'download-line',
        onClick: () =>
          download({
            format: 'png',
            name: titre,
            width: 900,
            height: 500,
            options: { ...chartOption, backgroundColor: '#ffffff' },
          }),
      },
    ];

    return actions;
  };
  return (
    <Module
      title={titre}
      titleTooltip={
        !isError && sumCountBy !== countByTotal
          ? 'Le total est inférieur à la somme des répartitions, car certaines actions peuvent se trouver dans plusieurs catégories à la fois.'
          : undefined
      }
      filters={filters}
      symbole={<PictoDocument className="w-16 h-16" />}
      menuActions={getMenuActions()}
      isLoading={isLoading}
      isEmpty={countByTotal === 0}
      emptyButtons={emptyButtons}
      isError={isError}
      errorButtons={errorButtons}
    >
      <div className="w-full h-full flex flex-col">
        <ReactECharts
          heightRatio={0.75}
          onEvents={{
            click: ({ event }) => {
              // Event type is not typed in the library
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const dataId = (event as any).data?.name_id;
              const dataUrl = makeFichesActionUrlWithParams(
                collectiviteId,
                filters ?? {},
                countByProperty,
                dataId
              );

              if (dataUrl) {
                router.push(dataUrl);
              } else {
                console.warn(
                  `click not supported for count by ${countByProperty} with value ${dataId}`
                );
              }
            },
          }}
          style={{
            marginTop: 'auto',
            marginBottom: 'auto',
          }}
          option={chartOption}
        />
        <Checkbox
          variant="switch"
          checked={displayItemsLabel}
          onChange={() => setDisplayItemsLabel(!displayItemsLabel)}
          label="Afficher la légende"
          labelClassname="text-sm text-grey-6"
          containerClassname="mt-auto"
        />
      </div>
    </Module>
  );
};
