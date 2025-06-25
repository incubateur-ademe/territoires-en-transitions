import { PersonalDefaultModuleKeys } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';

import TdbPersoModulePage from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/tableau-de-bord/personnel/[moduleKey]/_components/tdb-perso-module.page';

/**
 * Route tRPC encore non disponible pour le suivi personnel.
 * Pas de RSC possible pour le moment
 */
const Page = async ({
  params,
}: {
  params: Promise<{
    moduleKey: PersonalDefaultModuleKeys;
    collectiviteId: string;
  }>;
}) => {
  const { moduleKey, collectiviteId } = await params;
  return (
    <TdbPersoModulePage moduleKey={moduleKey} collectiviteId={collectiviteId} />
  );
};

export default Page;
