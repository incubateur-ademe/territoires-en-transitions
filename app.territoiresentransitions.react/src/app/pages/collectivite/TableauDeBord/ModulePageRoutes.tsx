import {
  PersonalDefaultModuleKeys,
  personalDefaultModuleKeysSchema,
} from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { SortFicheActionSettings } from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/FichesActionListe';
import ModuleSuiviPlansActionPage from '@/app/app/pages/collectivite/TableauDeBord/Collectivite/ModuleSuiviPlansAction/ModuleSuiviPlansActionPage';
import ModuleFichesActionsPage from '@/app/app/pages/collectivite/TableauDeBord/Personnel/ModuleFichesActions/ModuleFichesActionsPage';
import ModuleIndicateursPage from '@/app/app/pages/collectivite/TableauDeBord/Personnel/ModuleIndicateurs/ModuleIndicateursPage';
import { TDBViewParam } from '@/app/app/paths';
import {
  CollectiviteDefaultModuleKeys,
  collectiviteDefaultModuleKeysSchema,
} from '@/domain/collectivites';
import { useParams } from 'react-router-dom';

/**
 * Permet d'afficher la bonne page d'un module du tableau de bord plans d'action
 * Dans un premier temps, nous allons définir les modules dans le front.
 * On utilise le slug (url param) du module pour afficher la bonne page.
 * */
const ModulePageRoutes = () => {
  const { tdbModule: defaultModuleKey, tdbView } = useParams<{
    tdbModule: PersonalDefaultModuleKeys | CollectiviteDefaultModuleKeys;
    tdbView: TDBViewParam;
  }>();

  if (
    defaultModuleKey ===
      personalDefaultModuleKeysSchema.enum['actions-dont-je-suis-pilote'] ||
    defaultModuleKey ===
      personalDefaultModuleKeysSchema.enum['actions-recemment-modifiees']
  ) {
    const getSortSettings = (
      defaultModuleKey: string
    ): SortFicheActionSettings | undefined => {
      if (
        defaultModuleKey ===
        personalDefaultModuleKeysSchema.enum['actions-dont-je-suis-pilote']
      ) {
        return {
          defaultSort: 'titre',
        };
      }
      if (
        defaultModuleKey ===
        personalDefaultModuleKeysSchema.enum['actions-recemment-modifiees']
      ) {
        return {
          defaultSort: 'modified_at',
          sortOptionsDisplayed: ['modified_at'],
        };
      }
    };

    return (
      <ModuleFichesActionsPage
        view={tdbView}
        defaultModuleKey={defaultModuleKey}
        sortSettings={getSortSettings(defaultModuleKey)}
      />
    );
  }

  if (
    defaultModuleKey ===
    personalDefaultModuleKeysSchema.enum['indicateurs-de-suivi-de-mes-plans']
  ) {
    return (
      <ModuleIndicateursPage
        view={tdbView}
        defaultModuleKey={defaultModuleKey}
      />
    );
  }

  if (
    defaultModuleKey ===
    collectiviteDefaultModuleKeysSchema.enum['suivi-plan-actions']
  ) {
    return <ModuleSuiviPlansActionPage view={tdbView} />;
  }

  return <div>Ce module n'existe pas</div>;
};

export default ModulePageRoutes;
