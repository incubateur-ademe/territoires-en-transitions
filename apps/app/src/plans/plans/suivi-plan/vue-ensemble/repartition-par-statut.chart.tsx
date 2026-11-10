'use client';

import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { statutFicheActionToColor } from '@/app/plans/fiches/utils';
import { getChartOption } from '@/app/tableaux-de-bord/plans-action/fiches-action-count-by/utils/get-chart-option';
import { ReactECharts } from '@/app/ui/charts/echarts';
import { SANS_STATUT_LABEL, Statut } from '@tet/domain/plans';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type RepartitionItem = { statut: Statut | null; count: number };

export const RepartitionParStatut = ({
  collectiviteId,
  planId,
  total,
  repartition,
}: {
  collectiviteId: number;
  planId: number;
  total: number;
  repartition: RepartitionItem[];
}) => {
  const router = useRouter();
  const items = repartition.filter(({ count }) => count > 0);

  const makePilotageUrl = (statut: Statut | null) =>
    makeCollectivitePlanActionUrl({
      collectiviteId,
      planActionUid: planId.toString(),
      filters: statut ? { statuts: [statut] } : { noStatut: true },
    });

  const option = getChartOption({
    displayItemsLabel: false,
    countByProperty: 'statut',
    countByTotal: total,
    countByResult: Object.fromEntries(
      items.map(({ statut, count }) => [
        statut ?? SANS_STATUT_LABEL,
        { count, value: statut, label: statut ?? SANS_STATUT_LABEL },
      ])
    ),
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="w-48 shrink-0">
        <ReactECharts
          option={option}
          heightRatio={1}
          onEvents={{
            click: ({ event }) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const data = (event as any).data;
              if (data) {
                router.push(makePilotageUrl(data.name_id ?? null));
              }
            },
          }}
        />
      </div>
      <ul className="flex flex-col gap-1 w-full mb-0 p-0 list-none">
        {items.map(({ statut, count }) => (
          <li key={statut ?? SANS_STATUT_LABEL} className="p-0">
            <Link
              href={makePilotageUrl(statut)}
              className="flex items-center gap-2 text-sm text-primary-9 bg-none hover:underline"
            >
              <span
                className="h-3 w-3 rounded-sm"
                style={{
                  backgroundColor:
                    statutFicheActionToColor[statut ?? SANS_STATUT_LABEL],
                }}
              />
              <span className="grow">{statut ?? SANS_STATUT_LABEL}</span>
              <span className="font-bold">{count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
