import { PersonalDefaultModuleKeys } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Event, EventName, useEventTracker } from '@/ui';

import { useCurrentCollectivite } from '@/api/collectivites';
import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { SansPlanPlaceholder } from '@/app/tableaux-de-bord/plans-action/sans-plan.placeholder';
import { PermissionOperationEnum } from '@/domain/users';
import { useTdbPersoFetchModules } from '../_hooks/use-tdb-perso-fetch-modules';
import FichesDontJeSuisLePiloteModal from './fiches-dont-je-suis-le-pilote.modal';
import { FilteredFichesByModule } from './filtered-fiche-by-module';
import { IndicateursDontJeSuisLePiloteModule } from './indicateurs-dont-je-suis-le-pilote.module';
import MesuresDontJeSuisLePiloteModule from './mesures-dont-je-suis-le-pilote.module';

const orderedModules: PersonalDefaultModuleKeys[] = [
  'actions-dont-je-suis-pilote',
  'indicateurs-dont-je-suis-pilote',
  'mesures-dont-je-suis-pilote',
] as const;

const FICHES_MODULE_PROPERTIES: Partial<
  Record<
    PersonalDefaultModuleKeys,
    { event: EventName; ModalComponent: React.ComponentType<any> }
  >
> = {
  'actions-dont-je-suis-pilote': {
    event: Event.tdb.updateFiltresActionsPilotes,
    ModalComponent: FichesDontJeSuisLePiloteModal,
  },
} as const;

const Modules = () => {
  const { data: modules, isLoading } = useTdbPersoFetchModules();
  const tracker = useEventTracker();

  const { collectiviteId, niveauAcces, permissions } = useCurrentCollectivite();
  const { totalCount: plansCount } = useListPlans(collectiviteId);

  const noPlanAndCanCreatePlan =
    plansCount === 0 &&
    permissions?.includes(PermissionOperationEnum['PLANS.EDITION']);

  const hideModuleEditActions = niveauAcces === 'edition_fiches_indicateurs';

  if (isLoading) {
    return (
      <div className="h-80 flex">
        <SpinnerLoader className="m-auto" />
      </div>
    );
  }

  const isEmpty = !modules || modules?.length === 0;

  if (isEmpty) {
    return (
      <div className="h-64 flex items-center justify-center text-error-1">
        Une erreur est survenue
      </div>
    );
  }

  const moduleComponents: (React.ReactNode | null)[] = [];
  if (noPlanAndCanCreatePlan) {
    moduleComponents.push(<SansPlanPlaceholder />);
  }

  moduleComponents.push(
    ...orderedModules.map((key) => {
      const currentModule = modules.find((m) => m.defaultKey === key);

      if (currentModule?.type === 'fiche_action.list') {
        if (noPlanAndCanCreatePlan) {
          // We already display the placeholder to create a plan, so we don't need to display the list of fiche actions module.
          return null;
        }

        if (
          !permissions?.includes(
            PermissionOperationEnum['PLANS.FICHES.EDITION']
          ) &&
          !permissions?.includes(
            PermissionOperationEnum['PLANS.FICHES.LECTURE']
          )
        ) {
          // We don't have the permission to edit/read the fiche actions, so we don't need to display the list of fiche actions module.
          return null;
        }

        const properties = FICHES_MODULE_PROPERTIES[currentModule.defaultKey];
        if (!properties) {
          return null;
        }
        return (
          <FilteredFichesByModule
            key={currentModule.defaultKey}
            module={currentModule}
            hideEditAction={hideModuleEditActions}
            onFilterChange={() => tracker(properties.event)}
            ModalComponent={properties.ModalComponent}
          />
        );
      }

      if (
        currentModule?.type === 'indicateur.list' &&
        currentModule.defaultKey === 'indicateurs-dont-je-suis-pilote'
      ) {
        if (
          !permissions?.includes(
            PermissionOperationEnum['INDICATEURS.EDITION']
          ) &&
          !permissions?.includes(PermissionOperationEnum['INDICATEURS.LECTURE'])
        ) {
          // We don't have the permission to edit/read the indicateurs, so we don't need to display the list of indicateurs module.
          return null;
        }

        return (
          <IndicateursDontJeSuisLePiloteModule
            key={currentModule.defaultKey}
            module={currentModule}
            hideEditAction={hideModuleEditActions}
          />
        );
      }

      if (currentModule?.type === 'mesure.list') {
        if (
          !permissions?.includes(
            PermissionOperationEnum['REFERENTIELS.EDITION']
          ) &&
          !permissions?.includes(
            PermissionOperationEnum['REFERENTIELS.LECTURE']
          )
        ) {
          // We don't have the permission to edit/read the mesures, so we don't need to display the list of mesures module.
          return null;
        }

        return (
          <MesuresDontJeSuisLePiloteModule
            key={currentModule.defaultKey}
            module={currentModule}
            hideEditAction={hideModuleEditActions}
          />
        );
      }
    })
  );
  return moduleComponents;
};

export default Modules;
