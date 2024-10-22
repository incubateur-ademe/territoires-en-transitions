import {
  defaultSlugsSchema as colectiviteSlug,
  Slug as CollectiviteSlug,
} from '@tet/api/plan-actions/dashboards/collectivite-dashboard/domain/module.schema';
import {
  defaultSlugsSchema as personalSlug,
  Slug as PersonalSlug,
} from '@tet/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import ModuleSuiviPlansActionPage from '@tet/app/pages/collectivite/TableauDeBord/Collectivite/ModuleSuiviPlansAction/ModuleSuiviPlansActionPage';
import ModuleFichesActionsPage from '@tet/app/pages/collectivite/TableauDeBord/Personnel/ModuleFichesActions/ModuleFichesActionsPage';
import ModuleIndicateursPage from '@tet/app/pages/collectivite/TableauDeBord/Personnel/ModuleIndicateurs/ModuleIndicateursPage';
import { SortFicheActionSettings } from 'app/pages/collectivite/PlansActions/ToutesLesFichesAction/FichesActionListe';
import { TDBViewParam } from 'app/paths';
import { useParams } from 'react-router-dom';

/**
 * Permet d'afficher la bonne page d'un module du tableau de bord plans d'action
 * Dans un premier temps, nous allons définir les modules dans le front.
 * On utilise le slug (url param) du module pour afficher la bonne page.
 * */
const ModulePageRoutes = () => {
  const { tdbModule: slug, tdbView } = useParams<{
    tdbModule: PersonalSlug | CollectiviteSlug;
    tdbView: TDBViewParam;
  }>();

  if (
    slug === personalSlug.enum['actions-dont-je-suis-pilote'] ||
    slug === personalSlug.enum['actions-recemment-modifiees']
  ) {
    const getSortSettings = (
      slug: string
    ): SortFicheActionSettings | undefined => {
      if (slug === personalSlug.enum['actions-dont-je-suis-pilote']) {
        return {
          defaultSort: 'titre',
        };
      }
      if (slug === personalSlug.enum['actions-recemment-modifiees']) {
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

  if (slug === personalSlug.enum['indicateurs-de-suivi-de-mes-plans']) {
    return <ModuleIndicateursPage view={tdbView} slug={slug} />;
  }

  if (slug === colectiviteSlug.enum['suivi-plan-actions']) {
    return <ModuleSuiviPlansActionPage view={tdbView} slug={slug} />;
  }

  return <div>Ce module n'existe pas</div>;
};

export default ModulePageRoutes;
