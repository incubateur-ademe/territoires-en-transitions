/* eslint-disable @next/next/no-img-element */
'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import { useUser } from '@/api/users';
import {
  makeCollectivitePlansActionsNouveauUrl,
  makeReferentielRootUrl,
  makeTdbPlansEtActionsUrl,
} from '@/app/app/paths';
import { ModuleContainer } from '@/app/tableaux-de-bord/modules/module/module.container';
import { FichesActionCountByModule } from '@/app/tableaux-de-bord/plans-action/fiches-action-count-by/fiches-action-count-by.module';
import { Button } from '@/ui';
import Header from '../_components/header';
import Metrics from './_components/metrics';
import ScoreReferentielCard from './_components/score-referentiel.card';
import Section from './_components/section';
import { SuiviPlansModule } from './_components/suivi-plans.module';

import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import imageCountByIndicateursPlaceholder from './_components/action-countby-indicateurs-placeholder.png';
import imageCountByStatutPlaceholder from './_components/action-countby-statut-placeholder.png';
import imagePlanPlaceholder from './_components/suivi-plans-placeholder.png';

const Page = () => {
  const { prenom } = useUser();
  const { collectiviteId, nom, isReadOnly } = useCurrentCollectivite();

  const listPlansQuery = useListPlans(collectiviteId);
  const { totalCount: plansCount } = listPlansQuery;

  return (
    <>
      <Header
        title={
          isReadOnly
            ? `Tableau de bord de la collectivité ${nom}`
            : `Bonjour ${prenom}`
        }
        subtitle={
          !isReadOnly ? 'Bienvenue sur Territoires en Transitions' : undefined
        }
        // pageButtons={[
        //   {
        //     children: 'Partager',
        //     icon: 'share-forward-line',
        //     variant: 'white',
        //     size: 'sm',
        //     onClick: () => null,
        //   },
        // ]}
        activeTab="synthetique"
      />
      <div className="flex flex-col gap-8 mt-6">
        {/** Résumé par chiffres de la collectivité */}
        <Metrics />
        {/** État des lieux */}
        <Section
          title="État des lieux"
          links={[
            {
              href: makeReferentielRootUrl({ collectiviteId }),
              children: 'Voir le rapport complet état des lieux',
            },
          ]}
        >
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-2 xl:gap-6">
            <ScoreReferentielCard referentielId="cae" />
            <ScoreReferentielCard referentielId="eci" />
          </div>
        </Section>
        {/** Plans d'action */}
        <Section
          title="Plans d’action"
          links={[
            {
              href: makeTdbPlansEtActionsUrl({ collectiviteId }),
              children: 'Voir le rapport complet plans d’action',
            },
          ]}
        >
          {plansCount === 0 ? (
            <ModuleContainer className="overflow-hidden !p-0">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 backdrop-blur-sm bg-white/65">
                <h5 className="mb-0">
                  {isReadOnly
                    ? "Aucun plan d'action n'a été déposé"
                    : 'Vous n’avez pas encore créé de plan d’action !'}
                </h5>
                {!isReadOnly && (
                  <Button
                    href={makeCollectivitePlansActionsNouveauUrl({
                      collectiviteId,
                    })}
                    size="sm"
                  >
                    Créer un plan d’action
                  </Button>
                )}
              </div>
              <div className="grid lg:grid-cols-3 gap-6">
                <img
                  src={imagePlanPlaceholder.src}
                  alt="suivi des plans d'action"
                  className="m-auto w-full"
                />
                <img
                  src={imageCountByStatutPlaceholder.src}
                  alt="suivi des plans d'action"
                  className="m-auto w-full"
                />
                <img
                  src={imageCountByIndicateursPlaceholder.src}
                  alt="suivi des plans d'action"
                  className="m-auto w-full"
                />
              </div>
            </ModuleContainer>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SuiviPlansModule listPlansQuery={listPlansQuery} />

              <FichesActionCountByModule
                titre="Actions par statut"
                countByProperty="statut"
              />
              <FichesActionCountByModule
                titre="Actions et indicateurs associés"
                countByProperty="indicateurs"
              />
            </div>
          )}
        </Section>
      </div>
    </>
  );
};

export default Page;
