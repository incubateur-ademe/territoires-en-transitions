'use client';

import { PersonalDefaultModuleKeys } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { makeTdbCollectiviteUrl } from '@/app/app/paths';

import { useTdbPersoFetchSingle } from '../../_hooks/use-tdb-perso-fetch-single';
import FichesDontJeSuisLePiloteModulePage from './fiches-dont-je-suis-le-pilote.module-page';
import FichesRecemmentModifieesModulePage from './fiches-recemment-modifiees.module-page';
import IndicateursSuiviMesPlansModulePage from './indicateurs-suivi-mes-plans.module-page';

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
    moduleKey === 'indicateurs-de-suivi-de-mes-plans' &&
    module?.type === 'indicateur.list'
  ) {
    return (
      <IndicateursSuiviMesPlansModulePage
        module={module}
        parentPage={parentPage}
      />
    );
  }

  if (module?.type === 'fiche_action.list') {
    if (moduleKey === 'actions-dont-je-suis-pilote') {
      return (
        <FichesDontJeSuisLePiloteModulePage
          module={module}
          parentPage={parentPage}
        />
      );
    }

    if (moduleKey === 'actions-recemment-modifiees') {
      return (
        <FichesRecemmentModifieesModulePage
          module={module}
          parentPage={parentPage}
        />
      );
    }
  }
};

export default TdbPersoModulePage;
