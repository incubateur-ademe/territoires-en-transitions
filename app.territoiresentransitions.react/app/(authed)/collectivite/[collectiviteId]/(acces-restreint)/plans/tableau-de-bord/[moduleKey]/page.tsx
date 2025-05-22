import { CollectiviteDefaultModuleKeys } from '@/domain/collectivites';

import TdbPAModulePage from './_components/tdb-PA-module.page';

const Page = async ({
  params,
}: {
  params: Promise<{ moduleKey: CollectiviteDefaultModuleKeys }>;
}) => {
  const { moduleKey } = await params;

  return <TdbPAModulePage moduleKey={moduleKey} />;
};

export default Page;
