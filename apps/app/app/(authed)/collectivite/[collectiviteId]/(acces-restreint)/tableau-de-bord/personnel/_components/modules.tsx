import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import {
  ModuleFicheActionsSelect,
  ModuleIndicateursSelect,
  ModuleMesuresSelect,
  ModuleSelect,
  PersonalDefaultModuleKeys,
} from '@tet/api/plan-actions';
import { Event, EventName, useEventTracker } from '@tet/ui';

import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { ListPlansEmptyCard } from '@/app/plans/plans/list-all-plans/list-plans.empty-card';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useTdbPersoFetchModules } from '../_hooks/use-tdb-perso-fetch-modules';
import FichesDontJeSuisLePiloteModal from './fiches-dont-je-suis-le-pilote.modal';
import { FilteredFichesByModule } from './filtered-fiche-by-module';
import { IndicateursDontJeSuisLePiloteModule } from './indicateurs-dont-je-suis-le-pilote.module';
import MesuresDontJeSuisLePiloteModule from './mesures-dont-je-suis-le-pilote.module';

type ModuleDescriptor = {
  match: (module: Pick<ModuleSelect, 'defaultKey' | 'type'>) => boolean;
  isVisible: boolean;
  render: (module: ModuleSelect) => React.ReactNode | null;
};
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

  const currentCollectivite = useCurrentCollectivite();
  const {
    collectiviteId,
    niveauAcces,
    hasCollectivitePermission,
    isSimplifiedView,
  } = currentCollectivite;

  const { totalCount: plansCount } = useListPlans(collectiviteId);

  const noPlanAndCanCreatePlan =
    plansCount === 0 && hasCollectivitePermission('plans.mutate');

  // In order to simplify UI, we don't allow to edit modules for edition_fiches_indicateurs users
  // Later maybe generalized
  const canEditModules = (niveauAcces && !isSimplifiedView) || false;

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

  const modulesDescriptors: ModuleDescriptor[] = [
    {
      match: (m) =>
        m.type === 'fiche_action.list' &&
        m.defaultKey === 'actions-dont-je-suis-pilote',
      isVisible: hasCollectivitePermission('plans.fiches.read_confidentiel'),
      render: (module) => {
        if (noPlanAndCanCreatePlan) {
          // We already display the placeholder to create a plan, so we don't need to display the list of fiche actions module.
          return null;
        }

        const properties = FICHES_MODULE_PROPERTIES[module.defaultKey];
        if (!properties) {
          return null;
        }

        return (
          <FilteredFichesByModule
            key={module.defaultKey}
            module={module as ModuleFicheActionsSelect}
            bottomLinkViewType="mes-actions"
            isEditionEnabled={canEditModules}
            onFilterChange={() => tracker(properties.event)}
            ModalComponent={properties.ModalComponent}
          />
        );
      },
    },
    {
      match: (m) =>
        m.type === 'indicateur.list' &&
        m.defaultKey === 'indicateurs-dont-je-suis-pilote',
      isVisible: hasCollectivitePermission(
        'indicateurs.indicateurs.read_confidentiel'
      ),
      render: (module) => (
        <IndicateursDontJeSuisLePiloteModule
          key={module.defaultKey}
          module={module as ModuleIndicateursSelect}
          isEditionEnabled={canEditModules}
        />
      ),
    },
    {
      match: (m) => m.type === 'mesure.list',
      isVisible: hasCollectivitePermission('referentiels.read_confidentiel'),
      render: (module) => (
        <MesuresDontJeSuisLePiloteModule
          key={module.defaultKey}
          module={module as ModuleMesuresSelect}
          isEditionEnabled={canEditModules}
        />
      ),
    },
  ];

  const moduleComponents: (React.ReactNode | null)[] = [
    noPlanAndCanCreatePlan ? (
      <ListPlansEmptyCard key="sans-plan" collectivite={currentCollectivite} />
    ) : null,
    ...orderedModules
      .map((key) => modules.find((m) => m.defaultKey === key))
      .map((module) => {
        if (!module) return null;
        const d = modulesDescriptors.find((x) => x.match(module));
        if (!d || !d.isVisible) return null;
        return d.render(module);
      })
      .filter(Boolean),
  ];

  return moduleComponents;
};

export default Modules;
