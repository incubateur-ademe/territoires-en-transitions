import {useParams} from 'react-router-dom';

import {defaultSlugsSchema} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/domain/module.schema';
import ModuleFichesActionsPage from 'app/pages/collectivite/TableauDeBord/Module/ModuleFichesActions/ModuleFichesActionsPage';
import ModuleIndicateursPage from 'app/pages/collectivite/TableauDeBord/Module/ModuleIndicateurs/ModuleIndicateursPage';
import {TDBViewParam} from 'app/paths';
import {SortFicheActionSettings} from 'app/pages/collectivite/PlansActions/ToutesLesFichesAction/FichesActionListe';

/**
 * Permet d'afficher la bonne page d'un module du tableau de bord plans d'action
 * Dans un premier temps, nous allons définir les modules dans le front.
 * On utilise le slug (url param) du module pour afficher la bonne page.
 * */
const Modules = () => {
  const {tdbModule: slug, tdbView}: {tdbModule: string; tdbView: TDBViewParam} =
    useParams();

  if (
    slug === defaultSlugsSchema.enum['actions-dont-je-suis-pilote'] ||
    slug === defaultSlugsSchema.enum['actions-recemment-modifiees']
  ) {
    const getSortSettings = (
      slug: string
    ): SortFicheActionSettings | undefined => {
      if (slug === defaultSlugsSchema.enum['actions-dont-je-suis-pilote']) {
        return {
          defaultSort: 'titre',
        };
      }
      if (slug === defaultSlugsSchema.enum['actions-recemment-modifiees']) {
        return {
          defaultSort: 'modified_at',
          sortOptionsDisplayed: ['modified_at'],
        };
      }
    };

    return (
      <ModuleFichesActionsPage
        view={tdbView}
        slug={slug}
        sortSettings={getSortSettings(slug)}
      />
    );
  }

  if (slug === defaultSlugsSchema.enum['indicateurs-de-suivi-de-mes-plans']) {
    return <ModuleIndicateursPage view={tdbView} slug={slug} />;
  }
  return <div>Ce module n'existe pas</div>;
};

export default Modules;
