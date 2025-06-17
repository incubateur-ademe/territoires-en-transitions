    import { Statuts } from "@/app/app/pages/collectivite/PlansActions/PlanAction/list/card/Statuts";
import { useFichesActionCountBy } from "@/app/app/pages/collectivite/TableauDeBord/Collectivite/ModuleFichesActionCountBy/useFichesActionCountBy";
import { statutsEnumValues } from "@/backend/plans/fiches/index-domain";
import { Statut } from "packages/domain/src/plans/fiches/shared/models/fiche-action.table";

const useGetPlanActionStatus = ({
    planId,
  }: {
    planId: number;
  }): {
    ficheActionStatus: Record<Statut, { count: number; value: Statut }>;
    ficheActionTotal: number;
  } => {
    const { data: countByResponse } = useFichesActionCountBy('statut', {
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

  export const PlanActionStatus = ({ planId }: { planId: number }) => {
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
  