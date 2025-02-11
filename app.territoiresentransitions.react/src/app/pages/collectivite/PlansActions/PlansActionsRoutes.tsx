import { useCreateFicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheAction';
import FichesNonClassees from '@/app/app/pages/collectivite/PlansActions/FichesNonClassees';
import {
  collectiviteFichesNonClasseesPath,
  collectivitePlanActionAxePath,
  collectivitePlanActionLandingPath,
  collectivitePlanActionPath,
  collectivitePlansActionsCreerPath,
  collectivitePlansActionsImporterPath,
  collectivitePlansActionsNouveauPath,
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsNouveauUrl,
} from '@/app/app/paths';
import Link from 'next/link';
import { Redirect, Route } from 'react-router-dom';
import CollectivitePageLayout from '../CollectivitePageLayout/CollectivitePageLayout';
import { useFichesNonClasseesListe } from './FicheAction/data/useFichesNonClasseesListe';
import { CreerPlanPage } from './ParcoursCreationPlan/CreerPlanPage';
import { ImporterPlanPage } from './ParcoursCreationPlan/ImporterPlanPage';
import { SelectionPage } from './ParcoursCreationPlan/SelectionPage';
import { PlanActionPage } from './PlanAction/PlanActionPage';
import {
  generatePlanActionNavigationLinks,
  usePlansNavigation,
} from './PlanAction/data/usePlansNavigation';
import { Button } from '@/ui';

type Props = {
  collectivite_id: number;
  readonly: boolean;
};

/**
 * Routes starting with collectivite/:collectiviteId/plans see CollectiviteRoutes.tsx
 */
export const PlansActionsRoutes = ({ collectivite_id, readonly }: Props) => {
  const { data: axes } = usePlansNavigation();
  const { data: fichesNonClasseesListe } =
    useFichesNonClasseesListe(collectivite_id);

  const { mutate: createFicheAction } = useCreateFicheAction();

  const hasFicheNonClassees =
    (fichesNonClasseesListe && fichesNonClasseesListe.length > 0) || false;

  if (!axes) return null;

  return (
    <CollectivitePageLayout
      dataTest="PlansAction"
      sideNav={{
        links: generatePlanActionNavigationLinks(
          collectivite_id,
          hasFicheNonClassees,
          axes
        ),
        actions: !readonly && (
          <>
            <li className="p-0 list-none">
              <Button
                dataTest="CreerFicheAction"
                variant="outlined"
                size="sm"
                onClick={() => createFicheAction()}
              >
                Créer une fiche action
              </Button>
            </li>
            <li className="mt-4 p-0 list-none">
              <Button
                dataTest="AjouterPlanAction"
                size="sm"
                href={makeCollectivitePlansActionsNouveauUrl({
                  collectiviteId: collectivite_id,
                })}
                onClick={() => {
                  $crisp.push(['do', 'chat:open']);
                  $crisp.push([
                    'do',
                    'message:show',
                    [
                      'text',
                      'On est là pour vous aider à mettre en ligne vos plans d’action. Si vous hésitez entre les options de mise en ligne ou que vous avez des questions, contactez-nous !',
                    ],
                  ]);
                  $crisp.push([
                    'do',
                    'message:show',
                    [
                      'text',
                      "Vous trouverez aussi des infos utiles dans notre [Centre d'aide](https://aide.territoiresentransitions.fr/fr/article/comment-mettre-en-ligne-votre-plan-daction-1skcwdw/)",
                    ],
                  ]);
                  $crisp.push(['do', 'message:show', ['text', 'À bientôt 😄']]);
                }}
              >
                Ajouter un plan d&apos;action
              </Button>
            </li>
          </>
        ),
      }}
    >
      <Route exact path={collectivitePlanActionLandingPath}>
        {readonly && axes.length === 0 ? (
          <div className="flex">
            <div className="mt-64 mx-auto leading-relaxed text-grey-6 text-center">
              Aucun plan d&apos;action n&apos;a été ajouté
              <br />
              par cette collectivité pour le moment.
            </div>
          </div>
        ) : (
          <Redirect
            to={
              axes.length > 0
                ? makeCollectivitePlanActionUrl({
                    collectiviteId: collectivite_id,
                    planActionUid:
                      axes
                        .filter((axe) => axe.depth === 0)
                        .at(0)
                        ?.id.toString() || '',
                  })
                : makeCollectivitePlansActionsNouveauUrl({
                    collectiviteId: collectivite_id,
                  })
            }
          />
        )}
      </Route>

      {/* Menu de création d'un plan */}
      <Route exact path={collectivitePlansActionsNouveauPath}>
        <SelectionPage />
      </Route>

      {/* Importation d'un plan */}
      <Route exact path={collectivitePlansActionsImporterPath}>
        <ImporterPlanPage />
      </Route>

      {/* Création d'un plan */}
      <Route exact path={collectivitePlansActionsCreerPath}>
        <CreerPlanPage />
      </Route>

      {/** Vue détaillée d'un plan action */}
      <Route exact path={collectivitePlanActionPath}>
        <PlanActionPage />
      </Route>

      {/** Vue détaillée d'un axe */}
      <Route exact path={collectivitePlanActionAxePath}>
        <PlanActionPage />
      </Route>

      {/* Liste des fiches non classées */}
      <Route exact path={[collectiviteFichesNonClasseesPath]}>
        <FichesNonClassees />
      </Route>
    </CollectivitePageLayout>
  );
};
