'use client';

import { appLabels } from '@/app/labels/catalog';
import DonutChart from '@/app/ui/charts/Donut/DonutChart';
import { SANS_STATUT_LABEL, Statut, StatutEnum } from '@tet/domain/plans';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { makePilotageParStatutUrl } from '../make-pilotage-par-statut-url';
import {
  COULEURS_SUIVI_BY_STATUT,
  ORDRE_STATUTS,
} from '../statut-suivi-colors';

type RepartitionItem = { statut: Statut | null; count: number };

const ACTION_PAR_STATUT: Partial<Record<Statut, string>> = {
  [StatutEnum.A_DISCUTER]: appLabels.vueEnsembleTrancher,
  [StatutEnum.EN_RETARD]: appLabels.vueEnsembleArbitrer,
  [StatutEnum.BLOQUE]: appLabels.vueEnsembleDebloquer,
};

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
  const items = ORDRE_STATUTS.map((statut) => ({
    statut,
    count: repartition.find((item) => item.statut === statut)?.count ?? 0,
  })).filter(({ count }) => count > 0);

  const makePilotageUrl = (statut: Statut | null) =>
    makePilotageParStatutUrl({ collectiviteId, planId, statut });

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="shrink-0 -m-3">
        <DonutChart
          variant="ring"
          className="h-48 w-48"
          data={items.map(({ statut, count }) => ({
            id: statut ?? SANS_STATUT_LABEL,
            value: count,
            color: COULEURS_SUIVI_BY_STATUT[statut ?? SANS_STATUT_LABEL],
          }))}
          onClick={(id) =>
            router.push(
              makePilotageUrl(id === SANS_STATUT_LABEL ? null : (id as Statut))
            )
          }
          centeredElement={
            <div className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-grey-1 shadow-button">
              <b className="text-2xl leading-7 text-primary-9">{total}</b>
              <span className="text-xs text-grey-8">
                {appLabels.suiviPlanNbActions({
                  count: total,
                  withoutCount: true,
                })}
              </span>
            </div>
          }
        />
      </div>
      <ul className="flex flex-col flex-1 gap-1.5 min-w-56 mb-0 p-0 list-none">
        {items.map(({ statut, count }) => {
          const action = statut ? ACTION_PAR_STATUT[statut] : undefined;
          return (
            <li
              key={statut ?? SANS_STATUT_LABEL}
              className="flex items-center gap-3 p-0"
            >
              <Link
                href={makePilotageUrl(statut)}
                className="flex flex-1 min-w-0 items-center gap-2 text-sm text-primary-9 bg-none hover:underline"
              >
                <span
                  className="shrink-0 w-2.5 h-2.5 rounded-sm"
                  style={{
                    backgroundColor:
                      COULEURS_SUIVI_BY_STATUT[statut ?? SANS_STATUT_LABEL],
                  }}
                />
                {statut ?? SANS_STATUT_LABEL}
              </Link>
              {action ? (
                <Link
                  href={makePilotageUrl(statut)}
                  className="text-xs font-medium text-right text-primary-9 underline underline-offset-2 whitespace-nowrap bg-none hover:text-primary-7"
                >
                  {action}
                </Link>
              ) : (
                <span />
              )}
              <b className="w-7 shrink-0 text-sm text-right text-primary-9">
                {count}
              </b>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
