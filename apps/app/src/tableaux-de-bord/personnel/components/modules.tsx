import { PersonalDefaultModuleKeys } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Event, EventName, useEventTracker } from '@/ui';

import { useTdbPersoFetchModules } from '../hooks/use-tdb-perso-fetch-modules';
import FichesDontJeSuisLePiloteModal from './fiches-dont-je-suis-le-pilote.modal';
import FichesRecemmentModifieesModal from './fiches-recemment-modifiees.modal';
import { FilteredFichesByModule } from './filtered-fiche-by-module';
import { IndicateursDontJeSuisLePiloteModule } from './indicateurs-dont-je-suis-le-pilote.module';
import MesuresDontJeSuisLePiloteModule from './mesures-dont-je-suis-le-pilote.module';

type Props = {
  hasPlan?: boolean;
};

const orderedModules: PersonalDefaultModuleKeys[] = [
  'actions-dont-je-suis-pilote',
  'actions-recemment-modifiees',
  'indicateurs-dont-je-suis-pilote',
  'mesures-dont-je-suis-pilote',
] as const;

const FICHES_MODULE_PROPERTIES: Partial<
  Record<
    PersonalDefaultModuleKeys,
    { event: EventName; ModalComponent: React.ComponentType<any> }
  >
> = {
  'actions-recemment-modifiees': {
    event: Event.tdb.updateFiltresActionsModifiees,
    ModalComponent: FichesRecemmentModifieesModal,
  },
  'actions-dont-je-suis-pilote': {
    event: Event.tdb.updateFiltresActionsPilotes,
    ModalComponent: FichesDontJeSuisLePiloteModal,
  },
} as const;

const Modules = ({ hasPlan }: Props) => {
  const { data: modules, isLoading } = useTdbPersoFetchModules();
  const tracker = useEventTracker();

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

  return orderedModules.map((key) => {
    const currentModule = modules.find((m) => m.defaultKey === key);

    if (hasPlan && currentModule?.type === 'fiche_action.list') {
      const properties = FICHES_MODULE_PROPERTIES[currentModule.defaultKey];
      if (!properties) {
        return null;
      }
      return (
        <FilteredFichesByModule
          key={currentModule.defaultKey}
          module={currentModule}
          onFilterChange={() => tracker(properties.event)}
          ModalComponent={properties.ModalComponent}
        />
      );
    }

    if (
      currentModule?.type === 'indicateur.list' &&
      currentModule.defaultKey === 'indicateurs-dont-je-suis-pilote'
    ) {
      return (
        <IndicateursDontJeSuisLePiloteModule
          key={currentModule.defaultKey}
          module={currentModule}
        />
      );
    }

    if (currentModule?.type === 'mesure.list') {
      return (
        <MesuresDontJeSuisLePiloteModule
          key={currentModule.defaultKey}
          module={currentModule}
        />
      );
    }
  });
};

export default Modules;
