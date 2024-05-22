import {useParams} from 'react-router-dom';

import {TDBViewParam} from 'app/paths';
import {TDBModuleSlug} from './data';
import ModuleFichesActionsPage from 'app/pages/collectivite/TableauDeBord/Module/ModuleFichesActions/ModuleFichesActionsPage';
import ModuleIndicateursPage from 'app/pages/collectivite/TableauDeBord/Module/ModuleIndicateurs/ModuleIndicateursPage';

type Props = {
  plan_ids?: number[];
};

/**
 * Permet d'afficher la bonne page d'un module du tableau de bord plans d'action
 * Dans un premier temps, nous allons définir les modules dans le front.
 * On utilise le slug (url param) du module pour afficher la bonne page.
 * */
const Modules = ({plan_ids}: Props) => {
  const {
    tdbModule: slug,
    tdbView,
  }: {tdbModule: TDBModuleSlug; tdbView: TDBViewParam} = useParams();

  if (slug === TDBModuleSlug.ACTIONS_DONT_JE_SUIS_LE_PILOTE) {
    return <ModuleFichesActionsPage view={tdbView} />;
  }
  if (slug === TDBModuleSlug.INDICATEURS_DE_SUIVI_DE_MES_PLANS) {
    return <ModuleIndicateursPage view={tdbView} plan_ids={plan_ids} />;
  }
  return <div>Ce module n'existe pas</div>;
};

export default Modules;
