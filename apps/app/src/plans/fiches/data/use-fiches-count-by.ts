import { RouterInput, useTRPC } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';

type CountByRequest = RouterInput['plans']['fiches']['countBy'];

export const useFichesCountBy = (
  countByProperty: CountByRequest['countByProperty'],
  params: CountByRequest['filter']
) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  if (params.debutPeriode && params.debutPeriode.length === 10) {
    params.debutPeriode = DateTime.fromISO(params.debutPeriode, {
      zone: 'Europe/Paris',
    })
      .toJSDate()
      .toISOString();
  }
  if (params.finPeriode && params.finPeriode.length === 10) {
    params.finPeriode = DateTime.fromISO(params.finPeriode, {
      zone: 'Europe/Paris',
    })
      .toJSDate()
      .toISOString();
  }
  if (params.modifiedAfter && params.modifiedAfter.length === 10) {
    params.modifiedAfter = DateTime.fromISO(params.modifiedAfter, {
      zone: 'Europe/Paris',
    })
      .toJSDate()
      .toISOString();
  }

  return useQuery(
    trpc.plans.fiches.countBy.queryOptions({
      countByProperty,
      collectiviteId,
      filter: params,
    })
  );
};
