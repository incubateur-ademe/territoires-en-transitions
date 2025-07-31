'use client';

import { PersonalDefaultModuleKeys } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { IndicateursModulePage } from '@/app/tableaux-de-bord/indicateurs/indicateurs.module-page';
import { FichesActionModulePage } from '@/app/tableaux-de-bord/plans-action/fiches-action/fiches-action.module-page';
import { MesuresModulePage } from '@/app/tableaux-de-bord/referentiels/mesures.module-page';

import IndicateursDontJeSuisLePiloteModal from '../../_components/indicateurs-dont-je-suis-le-pilote.modal';
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
    moduleKey === 'indicateurs-dont-je-suis-pilote' &&
    module?.type === 'indicateur.list'
  ) {
    return (
      <IndicateursModulePage
        module={module}
        parentPage={parentPage}
        filtersModal={(openState) => (
          <IndicateursDontJeSuisLePiloteModal
            module={module}
            openState={openState}
            keysToInvalidate={[getFetchSingleKey(module.defaultKey)]}
          />
        )}
      />
    );
  }

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

  if (module?.type === 'fiche_action.list') {
    if (
      moduleKey !== 'actions-recemment-modifiees' &&
      moduleKey !== 'actions-dont-je-suis-pilote'
    ) {
      return null;
    }
    return <FichesActionModulePage module={module} parentPage={parentPage} />;
  }
};

export default TdbPersoModulePage;
