import { useCollectiviteId } from '@/api/collectivites';
import { RouterInput, trpc } from '@/api/utils/trpc/client';
import { DateTime } from 'luxon';

type CountByFilter = RouterInput['plans']['fiches']['countBy']['filter'];
type CountByProperty =
  RouterInput['plans']['fiches']['countBy']['countByProperty'];

export const useFichesCountBy = (
  countByProperty: CountByProperty,
  params: CountByFilter
) => {
  const collectiviteId = useCollectiviteId();

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

  return trpc.plans.fiches.countBy.useQuery({
    countByProperty,
    collectiviteId,
    filter: params,
  });
};
