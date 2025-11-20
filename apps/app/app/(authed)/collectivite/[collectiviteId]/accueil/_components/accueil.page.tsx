'use client';

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';

import {
  makeCollectiviteIndicateursListUrl,
  makeCollectivitePanierUrl,
  makeCollectivitePlansActionsCreerUrl,
  makeCollectiviteTrajectoirelUrl,
  makeReferentielRootUrl,
  makeTdbPlansEtActionsUrl,
  recherchesCollectivitesUrl,
} from '@/app/app/paths';
import { useGetCollectivitePanierInfo } from '@/app/collectivites/panier/data/useGetCollectivitePanierInfo';
import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { PictoCollectivite } from '@/app/ui/pictogrammes/PictoCollectivite';
import { PictoEtatDesLieux } from '@/app/ui/pictogrammes/PictoEtatDesLieux';
import { PictoIndicateurs } from '@/app/ui/pictogrammes/PictoIndicateurs';
import { PictoPanierActions } from '@/app/ui/pictogrammes/PictoPanierActions';
import { PictoPlansAction } from '@/app/ui/pictogrammes/PictoPlansAction';
import { PictoTrajectoire } from '@/app/ui/pictogrammes/PictoTrajectoire';
import { Button, Event, useEventTracker } from '@tet/ui';
import SectionCard from './section.card';

const AccueilPage = () => {
  const user = useUser();
  const collectivite = useCurrentCollectivite();

  const { totalCount: plansCount } = useListPlans(collectivite.collectiviteId);

  const { panier } = useGetCollectivitePanierInfo(collectivite.collectiviteId);

  const tracker = useEventTracker();

  return (
    <div data-test="accueil-collectivite">
      <h2 className="mb-4">Présentation des services</h2>
      <div className="mb-12 text-lg text-grey-8">
        <p>
          Bonjour {user?.prenom}, bienvenue sur le compte de la collectivité{' '}
          {collectivite.nom}.
        </p>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard
          picto={<PictoEtatDesLieux />}
          title="Pourquoi réaliser un diagnostic complet et objectif de votre politique de transition écologique ?"
          description="Les référentiels du programme Territoire Engagé Transition Écologique de l'ADEME vous permettent d’identifier vos forces et axes d’amélioration et de valoriser les actions réalisées."
          buttons={[
            {
              children: 'Je découvre en autonomie',
              href: makeReferentielRootUrl({
                collectiviteId: collectivite.collectiviteId,
              }),
            },
            {
              children: 'Découvrir l’accompagnement ADEME',
              href: 'https://www.territoiresentransitions.fr/programme',
              external: true,
              variant: 'outlined',
            },
          ]}
        />
        {/** 0 plan d'action */}
        {plansCount === 0 ? (
          <SectionCard
            picto={<PictoPlansAction />}
            title="Comment piloter mes plans d’actions ?"
            description="Centralisez les différents plans de la collectivité (PCAET, PAT, Plan Mobilité…), suivez la progression de vos actions à l’aide de nos tableaux de bord dynamiques et invitez les personnes qui pilotent ces actions !"
            buttons={[
              {
                children: 'Créer mon plan d’action',
                href: makeCollectivitePlansActionsCreerUrl({
                  collectiviteId: collectivite.collectiviteId,
                }),
                onClick: () => tracker(Event.accueil.createPlan),
              },
            ]}
          />
        ) : (
          // Plusieurs plans d'action
          <SectionCard
            picto={<PictoPlansAction />}
            title={`${plansCount} Plans d’actions suivis par la collectivité`}
            description="Centralisez et réalisez le suivi des plans d'actions de transition écologique de votre collectivité. Collaborez à plusieurs sur les fiches action pour planifier et piloter leur mise en oeuvre !"
            buttons={[
              {
                children: 'Voir le tableau de bord',
                href: makeTdbPlansEtActionsUrl({
                  collectiviteId: collectivite.collectiviteId,
                }),
              },
              {
                children: "S'inscrire à une démo",
                variant: 'outlined',
                href: 'https://calendly.com/territoiresentransitions/demo-fonctionnalite-plans-d-action',
                onClick: () => tracker(Event.accueil.viewInscriptionDemo),
                external: true,
              },
            ]}
          />
        )}
        <SectionCard
          picto={<PictoIndicateurs />}
          title="Comment mesurer la progression de mon territoire ?"
          description="Complétez et suivez les indicateurs liés à vos plans et à vos actions.
            Nous proposons une bibliothèque d'indicateurs pré-définis par l'ADEME et certains sont déjà remplis via l'open data !"
          buttons={[
            {
              children: 'Découvrir les indicateurs clés',
              href: makeCollectiviteIndicateursListUrl({
                collectiviteId: collectivite.collectiviteId,
                listId: 'cles',
              }),
            },
          ]}
        />
        <SectionCard
          picto={<PictoTrajectoire />}
          title="Comment ma collectivité peut-elle contribuer à la SNBC ?"
          description="Comparez vos objectifs avec la trajectoire SNBC territorialisée grâce à notre outil d'aide à la décision. Quantifiez les efforts à réaliser pour chaque secteur des Émissions GES et de la Consommation d'Énergie."
          buttons={[
            {
              children: 'Interroger la trajectoire de mon EPCI',
              href: makeCollectiviteTrajectoirelUrl({
                collectiviteId: collectivite.collectiviteId,
              }),
            },
            {
              children: 'En savoir plus',
              href: 'https://www.territoiresentransitions.fr/trajectoire',
              external: true,
              variant: 'outlined',
              onClick: () =>
                tracker(Event.accueil.viewTrajectoiresPagePublique),
            },
          ]}
        />
        <SectionCard
          picto={<PictoPanierActions />}
          title="Comment s’appuyer sur des actions de référence ?"
          description="Découvrez les Actions à Impact proposées par l’ADEME. Sélectionnez celles qui vous intéressent et utilisez-les comme base de travail et de discussion."
          additionalInfos="Communes ou intercommunalités, quel que soit votre engagement actuel dans la transition écologique, constituez-vous une base d’actions adaptées à vos compétences."
          buttons={[
            {
              children:
                panier && panier.count > 0
                  ? 'Reprendre ma sélection d’actions'
                  : 'Tester les actions à impact',
              href: makeCollectivitePanierUrl({
                collectiviteId: collectivite.collectiviteId,
                panierId: panier?.panierId,
              }),
              onClick: () => tracker(Event.accueil.viewPanierActions),
              external: true,
            },
          ]}
        />
        <SectionCard
          picto={<PictoCollectivite />}
          title="Comment progresser plus rapidement ?"
          description="Inspirez vous des états des lieux ou plans d’actions d’autres collectivités du territoire, trouvez facilement les contacts de vos homologues."
          buttons={[
            {
              children: 'Rechercher des modèles',
              href: recherchesCollectivitesUrl,
            },
          ]}
        />
      </div>
      <Button
        className="mt-20 mb-8 mx-auto"
        variant="outlined"
        href="https://www.territoiresentransitions.fr/"
        onClick={() => tracker(Event.accueil.viewSite)}
        external
      >
        Retourner sur le site
      </Button>
    </div>
  );
};

export default AccueilPage;
