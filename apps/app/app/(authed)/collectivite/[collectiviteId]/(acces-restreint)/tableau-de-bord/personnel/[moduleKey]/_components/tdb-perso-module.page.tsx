'use client';

import { PersonalDefaultModuleKeys } from '@/api/plan-actions';
import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { MesuresModulePage } from '@/app/tableaux-de-bord/referentiels/mesures.module-page';

import MesuresDontJeSuisLePiloteModal from '../../_components/mesures-dont-je-suis-le-pilote.modal';
import {
  getQueryKey as getFetchSingleKey,
  useTdbPersoFetchSingle,
} from '../../_hooks/use-tdb-perso-fetch-single';

type Props = {
  moduleKey: PersonalDefaultModuleKeys;
  collectiviteId: string;
};

const TdbPersoModulePage = ({ moduleKey, collectiviteId }: Props) => {
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
            keysToInvalidate={[getFetchSingleKey(module.defaultKey)]}
          />
        )}
      />
    );
  }
};

export default TdbPersoModulePage;
