import { PersonalDefaultModuleKeys } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';

import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';

import { useTdbPersoFetchModules } from '../_hooks/use-tdb-perso-fetch-modules';
import FichesDontJeSuisLePiloteModule from './fiches-dont-je-suis-le-pilote.module';
import FichesRecemmentModifieesModule from './fiches-recemment-modifiees.module';
import IndicateursSuiviMesPlansModule from './indicateurs-suivi-mes-plans.module';

const Modules = () => {
  const { data: modules, isLoading } = useTdbPersoFetchModules();

  if (isLoading) {
    return (
      <div className="h-64 flex">
        <div className="m-auto">
          <SpinnerLoader className="w-8 h-8" />
        </div>
      </div>
    );
  }

  const isEmpty = !modules || modules?.length === 0;

  if (isEmpty) {
    return (
      <div className="h-64 flex items-center justify-center text-error-1">
        Une erreur est survenue
      </div>
    );
  }

  const orderedModules: PersonalDefaultModuleKeys[] = [
    'actions-dont-je-suis-pilote',
    'indicateurs-de-suivi-de-mes-plans',
    'actions-recemment-modifiees',
  ];

  return orderedModules.map((key) => {
    const mod = modules.find((m) => m.defaultKey === key);

    if (mod?.type === 'indicateur.list') {
      return (
        <IndicateursSuiviMesPlansModule key={mod.defaultKey} module={mod} />
      );
    }
    if (mod?.type === 'fiche_action.list') {
      if (mod.defaultKey === 'actions-recemment-modifiees') {
        return (
          <FichesRecemmentModifieesModule key={mod.defaultKey} module={mod} />
        );
      }
      if (mod.defaultKey === 'actions-dont-je-suis-pilote') {
        return (
          <FichesDontJeSuisLePiloteModule key={mod.defaultKey} module={mod} />
        );
      }
    }
  });
};

export default Modules;
