import {
  ModuleFicheActionsSelect,
  PersonalDefaultModuleKeys,
} from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { Button, Event, useEventTracker } from '@/ui';

import { usePlanActionsCount } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlanActionsCount';
import FichesActionListe, {
  SortFicheActionSettings,
} from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/FichesActionListe';
import ModulePage from '@/app/app/pages/collectivite/TableauDeBord/components/ModulePage';
import ModalActionsDontJeSuisLePilote from '@/app/app/pages/collectivite/TableauDeBord/Personnel/ModuleFichesActions/ModalActionsDontJeSuisLePilote';
import ModalActionsRecemmentModifiees from '@/app/app/pages/collectivite/TableauDeBord/Personnel/ModuleFichesActions/ModalActionsRecemmentModifiees';
import {
  getQueryKey,
  usePersonalModuleFetch,
} from '@/app/app/pages/collectivite/TableauDeBord/Personnel/usePersonalModuleFetch';
import { TDBViewParam } from '@/app/app/paths';

type Props = {
  view: TDBViewParam;
  defaultModuleKey: PersonalDefaultModuleKeys;
  sortSettings?: SortFicheActionSettings;
};

/** Page d'un module du tableau de bord plans d'action */
const ModuleFichesActionsPage = ({
  view,
  defaultModuleKey,
  sortSettings,
}: Props) => {
  const { data: module, isLoading: isModuleLoading } =
    usePersonalModuleFetch(defaultModuleKey);

  const { count } = usePlanActionsCount();

  const trackEvent = useEventTracker();

  if (isModuleLoading || !module) {
    return null;
  }

  return (
    <ModulePage view={view} title={module.titre}>
      <FichesActionListe
        filtres={module.options.filtre ?? {}}
        customFilterBadges={{
          planActions:
            module.options.filtre?.planActionIds?.length === count &&
            'Tous les planssss',
        }}
        sortSettings={sortSettings}
        settings={(openState) => (
          <>
            <Button
              variant="outlined"
              icon="equalizer-line"
              size="sm"
              onClick={() => {
                openState.setIsOpen(true);
                trackEvent(
                  defaultModuleKey === 'actions-dont-je-suis-pilote'
                    ? Event.tdb.updateFiltresActionsPilotes
                    : Event.tdb.updateFiltresActionsModifiees
                );
              }}
            >
              Filtrer
            </Button>
            {module.defaultKey === 'actions-dont-je-suis-pilote' &&
              openState.isOpen && (
                <ModalActionsDontJeSuisLePilote
                  openState={openState}
                  module={module as ModuleFicheActionsSelect}
                  keysToInvalidate={[getQueryKey(defaultModuleKey)]}
                />
              )}
            {module.defaultKey === 'actions-recemment-modifiees' &&
              openState.isOpen && (
                <ModalActionsRecemmentModifiees
                  openState={openState}
                  module={module as ModuleFicheActionsSelect}
                  keysToInvalidate={[getQueryKey(defaultModuleKey)]}
                />
              )}
          </>
        )}
        displayEditionMenu
      />
    </ModulePage>
  );
};

export default ModuleFichesActionsPage;
