import { useFichesCountBy } from '@/app/plans/fiches/_data/use-fiches-count-by';
import { Statuts } from '@/app/plans/plans/card/statuts';
import { Statut, statutsEnumValues } from '@/domain/plans/fiches';

const useGetPlanActionStatus = ({
  planId,
}: {
  planId: number;
}): {
  ficheActionStatus: Record<Statut, { count: number; value: Statut }>;
  ficheActionTotal: number;
} => {
  const { data: countByResponse } = useFichesCountBy('statut', {
    planActionIds: [planId],
  });

  return {
    ficheActionStatus: statutsEnumValues.reduce((acc, status) => {
      const { value, count } = countByResponse?.countByResult?.[status] ?? {};
      if (!value) {
        return acc;
      }
      acc[status] = {
        count: count ?? 0,
        value: value as Statut,
      };
      return acc;
    }, {} as Record<Statut, { count: number; value: Statut }>),
    ficheActionTotal: countByResponse?.total || 0,
  };
};

export const PlanStatus = ({ planId }: { planId: number }) => {
  const { ficheActionStatus, ficheActionTotal } = useGetPlanActionStatus({
    planId,
  });
  return (
    <Statuts
      statuts={ficheActionStatus}
      fichesCount={ficheActionTotal}
      display="row"
    />
  );
};
