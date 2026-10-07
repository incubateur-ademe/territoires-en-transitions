'use client';

import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { MesuresModulePage } from '@/app/tableaux-de-bord/referentiels/mesures.module-page';
import { useTRPC } from '@tet/api';
import { PersonalDefaultModuleKeys } from '@tet/domain/metrics';

import MesuresDontJeSuisLePiloteModal from '../../_components/mesures-dont-je-suis-le-pilote.modal';
import { useTdbPersoFetchSingle } from '../../_hooks/use-tdb-perso-fetch-single';

type Props = {
  moduleKey: PersonalDefaultModuleKeys;
  collectiviteId: string;
};

const TdbPersoModulePage = ({ moduleKey, collectiviteId }: Props) => {
  const trpc = useTRPC();

  const parentPage = {
    label: 'Mon suivi personnel',
    link: makeTdbCollectiviteUrl({
      collectiviteId: parseInt(collectiviteId),
      view: 'personnel',
    }),
  };

  const { data: module } = useTdbPersoFetchSingle(moduleKey);

  if (
    moduleKey === 'mesures-dont-je-suis-pilote' &&
    module?.type === 'mesure.list'
  ) {
    return (
      <MesuresModulePage
        module={module}
        parentPage={parentPage}
        filtersModal={(openState) => (
          <MesuresDontJeSuisLePiloteModal
            module={module}
            openState={openState}
            keysToInvalidate={[
              trpc.metrics.users.getModule.queryKey({
                collectiviteId: module.collectiviteId,
                defaultKey: moduleKey,
              }),
            ]}
          />
        )}
      />
    );
  }
};

export default TdbPersoModulePage;
