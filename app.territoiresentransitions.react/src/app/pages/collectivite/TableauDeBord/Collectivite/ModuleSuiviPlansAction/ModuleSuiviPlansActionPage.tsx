import { useState } from 'react';

import PlansActionListe from '@/app/app/pages/collectivite/PlansActions/PlanAction/list/PlansActionListe';
import { useCollectiviteModuleFetch } from '@/app/app/pages/collectivite/TableauDeBord/Collectivite/useCollectiviteModuleFetch';
import { ModuleDisplay } from '@/app/app/pages/collectivite/TableauDeBord/components/Module';
import ModulePage from '@/app/app/pages/collectivite/TableauDeBord/components/ModulePage';
import { TDBViewParam } from '@/app/app/paths';
import { ModulePlanActionListType } from '@/domain/collectivites';

type Props = {
  view: TDBViewParam;
};

/** Page du module suivi des plans d'action de la collectivité */
const ModuleSuiviPlansActionPage = ({ view }: Props) => {
  const { data: dataModule, isLoading: isModuleLoading } =
    useCollectiviteModuleFetch('suivi-plan-actions');

  const tdbModule = dataModule as ModulePlanActionListType;

  const [display, setDisplay] = useState<ModuleDisplay>('row');

  if (isModuleLoading || !tdbModule) {
    return null;
  }

  return (
    <ModulePage view={view} title={tdbModule.titre}>
      <PlansActionListe
        filtres={tdbModule.options.filtre ?? {}}
        displaySettings={{ display, setDisplay }}
        // settings={collectivite?.niveau_acces === 'admin' ? (openState) => (
        //   <>
        //     <Button
        //       variant="outlined"
        //       icon="equalizer-line"
        //       size="sm"
        //       children="Filtrer"
        //       onClick={() => {
        //         openState.setIsOpen(true);
        //         trackEvent('tdb_modifier_filtres_suivi_plan_actions', {
        //           collectivite_id: module.collectiviteId,
        //         });
        //       }}
        //     />
        //     <ModalSuiviPlansAction
        //       module={module}
        //       openState={openState}
        //       displaySettings={{ display, setDisplay }}
        //       keysToInvalidate={[getQueryKey(defaultModuleKey)]}
        //     />
        //   </>
        // ) : undefined}
      />
    </ModulePage>
  );
};

export default ModuleSuiviPlansActionPage;
