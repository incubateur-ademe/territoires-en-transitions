import { CollectiviteDefaultModuleKeys } from '@/domain/collectivites';

import { createServerClient } from '@/api/utils/trpc/server-client';
import { makeTdbPlansEtActionsUrl } from '@/app/app/paths';
import PlansActionList from '@/app/plans-action/plans/plans-action.list';
import ModulePage from '@/app/tableaux-de-bord/modules/module.page';

const Page = async ({
  params,
}: {
  params: Promise<{
    moduleKey: CollectiviteDefaultModuleKeys;
    collectiviteId: string;
  }>;
}) => {
  const { moduleKey, collectiviteId } = await params;

  const parentPage = {
    label: 'Tableau de bord Plans & Actions',
    link: makeTdbPlansEtActionsUrl({
      collectiviteId: parseInt(collectiviteId),
    }),
  };

  const pageModule =
    await createServerClient().collectivites.tableauDeBord.get.query({
      collectiviteId: parseInt(collectiviteId),
      defaultKey: moduleKey,
    });

  if (
    moduleKey === 'suivi-plan-actions' &&
    pageModule.type === 'plan-action.list'
  ) {
    return (
      <ModulePage title={pageModule.titre} parentPage={parentPage}>
        <PlansActionList filtres={pageModule.options.filtre ?? {}} />
      </ModulePage>
    );
  }
};

export default Page;
