'use client';

import { makeTdbPlansEtActionsUrl } from '@/app/app/paths';
import { CollectiviteDefaultModuleKeys } from '@/domain/collectivites';

import ModulePage from '@/app/tableaux-de-bord/modules/module.page';

import PlansActionList from '@/app/plans-action/plans/plans-action.list';
import { useFetchModule } from '../../_data/use-fetch-module';

type Props = {
  moduleKey: CollectiviteDefaultModuleKeys;
};

const TdbPAModulePage = ({ moduleKey }: Props) => {
  const { data: module } = useFetchModule(moduleKey);

  if (!module) {
    return null;
  }

  const parentPage = {
    label: 'Tableau de bord Plans & Actions',
    link: makeTdbPlansEtActionsUrl({
      collectiviteId: module.collectiviteId,
    }),
  };

  if (
    moduleKey === 'suivi-plan-actions' &&
    module.type === 'plan-action.list'
  ) {
    return (
      <ModulePage title={module.titre} parentPage={parentPage}>
        <PlansActionList filtres={module.options.filtre ?? {}} />
      </ModulePage>
    );
  }
};

export default TdbPAModulePage;
