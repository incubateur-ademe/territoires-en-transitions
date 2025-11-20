import { PersonalDefaultModuleKeys } from '@tet/api/plan-actions';

import TdbPersoModulePage from './_components/tdb-perso-module.page';

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
