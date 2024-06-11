import {useParams} from 'react-router-dom';

import {TDBViewParam} from 'app/paths';
import ModuleFichesActionsPage from 'app/pages/collectivite/TableauDeBord/Module/ModuleFichesActions/ModuleFichesActionsPage';
import ModuleIndicateursPage from 'app/pages/collectivite/TableauDeBord/Module/ModuleIndicateurs/ModuleIndicateursPage';
import {
  defaultSlugsSchema,
  getDefaultModules,
} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/domain/module.schema';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useAuth} from 'core-logic/api/auth/AuthProvider';

type Props = {
  planIds?: number[];
};

/**
 * Permet d'afficher la bonne page d'un module du tableau de bord plans d'action
 * Dans un premier temps, nous allons définir les modules dans le front.
 * On utilise le slug (url param) du module pour afficher la bonne page.
 * */
const Modules = ({planIds}: Props) => {
  const collectiviteId = useCollectiviteId();

  const userId = useAuth().user?.id;

  const {tdbModule: slug, tdbView}: {tdbModule: string; tdbView: TDBViewParam} =
    useParams();

  const modules = getDefaultModules({
    collectiviteId: collectiviteId!,
    userId: userId!,
  });

  const moduleIndicateursSuivi = modules.find(
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
