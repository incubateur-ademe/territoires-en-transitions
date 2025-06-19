import { useCollectiviteId } from '@/api/collectivites';
import { FetchedPlanAction } from '@/api/plan-actions';
import { usePlansActionsListe } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import {
  makeCollectivitePlansActionsCreerUrl,
  makeTdbPlansEtActionsModuleUrl,
} from '@/app/app/paths';
import { useFichesActionCountBy } from '@/app/plans-action/fiches/_data/use-fiches-action-count-by';
import Statuts from '@/app/plans-action/plans/card/statuts';
import ModuleContainer from '@/app/tableaux-de-bord/modules/module/module.container';
import ModuleEmpty from '@/app/tableaux-de-bord/modules/module/module.empty';
import PictoDocument from '@/app/ui/pictogrammes/PictoDocument';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Statut } from '@/domain/plans/fiches';
import { CountByRecordType } from '@/domain/utils';
import { Button, Event, useEventTracker } from '@/ui';

/**
 * Module unique car la page TDB synthétique
 * n'a pas encore de module enregistré dans la base.
 * À adapter lorsque ce sera le cas avec le module générique `SuiviPlansModule` dans `src/`.
 */
const SuiviPlansModule = () => {
  const tracker = useEventTracker();
  const collectiviteId = useCollectiviteId();

  const { data, isLoading } = usePlansActionsListe({});

  if (isLoading) {
    return (
      <ModuleContainer>
        <div className="m-auto">
          <SpinnerLoader className="w-8 h-8" />
        </div>
      </ModuleContainer>
    );
  }

  if (data?.count === 0) {
    return (
      <ModuleEmpty
        symbole={<PictoDocument className="w-16 h-16" />}
        title="Suivi de l’avancée des plans"
        emptyButtons={[
          {
            children: "Créer un plan d'action",
            href: makeCollectivitePlansActionsCreerUrl({ collectiviteId }),
          },
        ]}
      />
    );
  }

  return (
    <ModuleContainer className="gap-8">
      <h6 className="mb-0">Suivi de l’avancée des plans</h6>
      <div className="flex flex-col gap-8">
        {data?.plans.map((plan) => (
          <Plan key={plan.id} plan={plan} />
        ))}
      </div>
      <Button
        className="ml-auto mt-auto"
        variant="underlined"
        size="sm"
        onClick={() => tracker(Event.tdb.viewTousLesPlans)}
        href={makeTdbPlansEtActionsModuleUrl({
          collectiviteId,
          module: 'suivi-plan-actions',
        })}
      >
        Voir tous les plans
      </Button>
    </ModuleContainer>
  );
};

export default SuiviPlansModule;

const Plan = ({ plan }: { plan: FetchedPlanAction }) => {
  const { data: countByResponse } = useFichesActionCountBy('statut', {
    planActionIds: [plan.id],
  });

  if (!countByResponse) {
    return null;
  }

  const pourcentage = Math.round(
    (countByResponse.countByResult['Réalisé'].count /
      Object.values(countByResponse.countByResult).reduce(
        (sum, item) => sum + item.count,
        0
      )) *
      100 || 0
  );

  return (
    <div key={plan.id} className="flex flex-col gap-2">
      <div className="flex justify-between gap-6">
        <span className="uppercase font-bold text-primary-9">{plan.nom}</span>
        <span className="text-sm text-grey-8 font-medium">{pourcentage}%</span>
      </div>
      {countByResponse?.countByResult && (
        <Statuts
          statuts={countByResponse.countByResult as CountByRecordType<Statut>}
          fichesCount={countByResponse?.total || 0}
          display="row"
        />
      )}
    </div>
  );
};
