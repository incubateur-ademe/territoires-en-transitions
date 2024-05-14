import {useParams} from 'react-router-dom';

import {TDBViewParam} from 'app/paths';
import {TDBModuleSlug} from './data';
import ModuleFichesActionsPage from 'app/pages/collectivite/TableauDeBord/Module/ModuleFichesActions/ModuleFichesActionsPage';

/**
 * Permet d'afficher la bonne page d'un module du tableau de bord plans d'action
 * Dans un premier temps, nous allons définir les modules dans le front.
 * On utilise le slug (url param) du module pour afficher la bonne page.
 * */
const Modules = () => {
  const {
    tdbModule: slug,
    tdbView,
  }: {tdbModule: TDBModuleSlug; tdbView: TDBViewParam} = useParams();

  if (slug === 'actions-dont-je-suis-pilote') {
    return <ModuleFichesActionsPage view={tdbView} />;
  }
  return <div>Ce module n'existe pas</div>;
};

export default Modules;
