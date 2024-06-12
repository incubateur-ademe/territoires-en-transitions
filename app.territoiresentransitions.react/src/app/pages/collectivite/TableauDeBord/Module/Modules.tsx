import {useParams} from 'react-router-dom';

import {defaultSlugsSchema} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/domain/module.schema';
import ModuleFichesActionsPage from 'app/pages/collectivite/TableauDeBord/Module/ModuleFichesActions/ModuleFichesActionsPage';
import ModuleIndicateursPage from 'app/pages/collectivite/TableauDeBord/Module/ModuleIndicateurs/ModuleIndicateursPage';
import {TDBViewParam} from 'app/paths';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useModulesFetch} from './useModulesFetch';

type Props = {
  planIds?: number[];
};

/**
 * Permet d'afficher la bonne page d'un module du tableau de bord plans d'action
 * Dans un premier temps, nous allons définir les modules dans le front.
 * On utilise le slug (url param) du module pour afficher la bonne page.
 * */
const Modules = ({planIds}: Props) => {
  const {tdbModule: slug, tdbView}: {tdbModule: string; tdbView: TDBViewParam} =
    useParams();

  const {data: modules, isLoading} = useModulesFetch();

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  const moduleIndicateursSuivi = modules?.find(
    m => m.slug === defaultSlugsSchema.enum['indicateurs-de-suivi-de-mes-plans']
  );

  if (slug === defaultSlugsSchema.enum['actions-dont-je-suis-pilote']) {
    return <ModuleFichesActionsPage view={tdbView} />;
  }

  if (
    slug === defaultSlugsSchema.enum['indicateurs-de-suivi-de-mes-plans'] &&
    moduleIndicateursSuivi
  ) {
    return (
      <ModuleIndicateursPage
        view={tdbView}
        module={moduleIndicateursSuivi}
        planIds={planIds}
      />
    );
  }
  return <div>Ce module n'existe pas</div>;
};

export default Modules;
