import { useUser } from '@/api/users/user-provider';
import { useNbActionsDansPanier } from '@/app/app/Layout/Header/useNbActionsDansPanier';
import PictoCollectivite from '@/app/app/pages/collectivite/Accueil/pictogrammes/PictoCollectivite';
import PictoEtatDesLieux from '@/app/app/pages/collectivite/Accueil/pictogrammes/PictoEtatDesLieux';
import PictoIndicateurs from '@/app/app/pages/collectivite/Accueil/pictogrammes/PictoIndicateurs';
import PictoPanierActions from '@/app/app/pages/collectivite/Accueil/pictogrammes/PictoPanierActions';
import PictoPlansAction from '@/app/app/pages/collectivite/Accueil/pictogrammes/PictoPlansAction';
import PictoTrajectoire from '@/app/app/pages/collectivite/Accueil/pictogrammes/PictoTrajectoire';
import SectionCard from '@/app/app/pages/collectivite/Accueil/SectionCard';
import { useCreateFicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheAction';
import { useFicheActionCount } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useFicheActionCount';
import { usePlanActionsCount } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlanActionsCount';
import {
  makeCollectivitePanierUrl,
  makeCollectivitePlansActionsNouveauUrl,
  makeCollectiviteTousLesIndicateursUrl,
  makeCollectiviteToutesLesFichesUrl,
  makeCollectiviteTrajectoirelUrl,
  makeReferentielRootUrl,
  makeTableauBordUrl,
  recherchesCollectivitesUrl,
} from '@/app/app/paths';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { Button, Event, TrackPageView, useEventTracker } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';
import { pick } from 'es-toolkit';

/**
 * Affiche la page d'accueil d'une collectivité
 */
const Accueil = (): JSX.Element => {
  const collectivite = useCurrentCollectivite();

  const user = useUser();

  const { mutate: createFicheAction } = useCreateFicheAction();

  const { count: planActionsCount } = usePlanActionsCount();

  const { count: ficheActionCount } = useFicheActionCount();

  const { data: panier } = useNbActionsDansPanier(
    collectivite?.collectiviteId!
  );

  const trackEvent = useEventTracker();

  if (!collectivite?.collectiviteId) return <></>;

  const { collectiviteId } = collectivite;

  return (
    <PageContainer dataTest="accueil-collectivite">
      <TrackPageView
        pageName={`app/accueil`}
        properties={pick(collectivite, [
          'collectiviteId',
          'niveauAcces',
          'role',
        ])}
      />
      <h2 className="mb-4">Bonjour {user?.prenom} !</h2>
      <div className="mb-12 text-lg text-grey-8">
        <p>
          Bienvenue sur Territoires en Transitions ! À la fois espace de travail
          personnel et collaboratif, la plateforme est là pour vous aider à
          accélérer la transition écologique de votre collectivité.
        </p>

        <p>
          Développée par l'ADEME en partenariat avec beta.gouv, elle s'adresse à
          toutes les collectivités.
          <br />
          Que vous soyez ou non (ou pas encore !) engagés dans le programme de
          l'ADEME, découvrez et utilisez gratuitement les fonctionnalités
          proposées !
        </p>
        <p>
          La plateforme évolue selon vos besoins. N'hésitez pas à nous écrire
          via le chat en ligne pour échanger !
        </p>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard
          picto={<PictoEtatDesLieux />}
          title="État des lieux"
          description="Faites vos états des lieux dans le cadre du programme Territoire Engagé Transition Écologique de l'ADEME."
          buttons={[
            {
              children: "Synthèse de l'EDL",
              href: makeReferentielRootUrl({
                collectiviteId,
              }),
              onClick: () => trackEvent(Event.accueil.viewSyntheseEtatLieux),
            },
            {
              children: "Plus d'informations sur le programme",
              href: 'https://www.territoiresentransitions.fr/programme',
              external: true,
              variant: 'outlined',
              onClick: () => trackEvent(Event.accueil.viewMoreInfos),
            },
          ]}
        />
        <SectionCard
          picto={<PictoPlansAction />}
          title={`${planActionsCount > 0 ? `${planActionsCount} ` : ''}${
            planActionsCount === 1 ? 'Plan d’action' : 'Plans d’actions'
          }`}
          description="Centralisez et réalisez le suivi des plans d'actions de transition écologique de votre collectivité. Collaborez à plusieurs sur les fiches action pour planifier et piloter leur mise en oeuvre !"
          buttons={[
            collectivite.isReadOnly
              ? {
                  children: 'Aller sur le tableau de bord de la collectivité',
                  href: makeTableauBordUrl({
                    collectiviteId,
                    view: 'collectivite',
                  }),
                  onClick: () =>
                    trackEvent(Event.accueil.viewTableauDeBordCollectivite),
                }
              : planActionsCount > 0
              ? {
                  children: 'Aller sur mon tableau de bord',
                  href: makeTableauBordUrl({
                    collectiviteId,
                    view: 'personnel',
                  }),
                  onClick: () =>
                    trackEvent(Event.accueil.viewTableauDeBordPersonnel),
                }
              : {
                  children: 'Créer mon 1er plan !',
                  href: makeCollectivitePlansActionsNouveauUrl({
                    collectiviteId,
                  }),
                  onClick: () => trackEvent(Event.accueil.createPlan),
                },
            ficheActionCount > 0
              ? {
                  children: 'Toutes les fiches action',
                  href: makeCollectiviteToutesLesFichesUrl({
                    collectiviteId,
                  }),
                  variant: 'outlined',
                  onClick: () => trackEvent(Event.accueil.viewToutesLesFiches),
                }
              : {
                  children: 'Créer une fiche action',
                  onClick: () => {
                    createFicheAction();
                    trackEvent(Event.accueil.createFiche);
                  },
                  variant: 'outlined',
                },
          ]}
        />
        <SectionCard
          picto={<PictoIndicateurs />}
          title="Indicateurs"
          description="Complétez et suivez les indicateurs liés à vos plans et à vos actions.
            Nous proposons une bibliothèque d'indicateurs pré-définis par l'ADEME et certains sont déjà remplis via l'open data !"
          buttons={[
            {
              children: 'Voir tous les indicateurs',
              href: makeCollectiviteTousLesIndicateursUrl({ collectiviteId }),
              onClick: () => trackEvent(Event.accueil.viewTousLesIndicateurs),
            },
            {
              children: 'Découvrir les indicateurs disponibles en open data',
              href: `${makeCollectiviteTousLesIndicateursUrl({
                collectiviteId,
              })}?od=true`,
              onClick: () => trackEvent(Event.accueil.viewIndicateursOpenData),
              variant: 'outlined',
            },
          ]}
        />
        <SectionCard
          picto={<PictoTrajectoire />}
          title="Trajectoire SNBC territorialisée"
          description="Calculez votre trajectoire SNBC territorialisée et définissez ou validez vos objectifs (par exemple lors d’un suivi annuel ou d’un bilan à mi-parcours d’un PCAET), en quantifiant les efforts à réaliser pour chaque secteur. Cette trajectoire n’est pas contraignante : elle sert d’outil d’aide à la décision et de point de référence."
          buttons={[
            {
              children: 'Découvrir la fonctionnalité',
              href: makeCollectiviteTrajectoirelUrl({ collectiviteId }),
              onClick: () => trackEvent(Event.accueil.viewTrajectoires),
            },
          ]}
        />
        <SectionCard
          picto={<PictoCollectivite />}
          title="Collectivités"
          description="Inspirez vous des états des lieux, plans d'actions et indicateurs proches géographiquement ou qui vous ressemblent.
            Parcourez librement les plans d'actions et indicateurs des autres collectivités utilisatrices de l'outil !"
          buttons={[
            {
              children: "S'inspirer",
              href: recherchesCollectivitesUrl,
              onClick: () => trackEvent(Event.accueil.viewCollectivites),
            },
            {
              children: 'En savoir plus sur la confidentialité',
              href: 'https://aide.territoiresentransitions.fr/fr/article/la-confidentialite-sur-territoires-en-transitions-18gpnno/',
              onClick: () =>
                trackEvent(Event.accueil.viewCollectivitesConfidentialite),
              variant: 'outlined',
              external: true,
            },
          ]}
        />
        <SectionCard
          picto={<PictoPanierActions />}
          title={
            panier && panier.count > 0
              ? `${panier.count} action${
                  panier.count > 1 ? 's' : ''
                } à impact sélectionnée${panier.count > 1 ? 's' : ''}`
              : 'Actions à Impact'
          }
          description="Identifiez de nouvelles actions à mettre en place sur votre territoire pour accélérer la transition écologique."
          additionalInfos="Communes ou intercommunalités, quel que soit votre engagement actuel dans la transition écologique, constituez-vous une base d’actions adaptées à vos compétences."
          buttons={[
            {
              children:
                panier && panier.count > 0
                  ? 'Reprendre ma sélection d’actions'
                  : 'Tester les actions à impact',
              href: makeCollectivitePanierUrl({
                collectiviteId,
                panierId: panier?.panierId,
              }),
              onClick: () => trackEvent(Event.accueil.viewPanierActions),
              external: true,
            },
          ]}
        />
      </div>
      <Button
        className="mt-20 mb-8 mx-auto"
        variant="outlined"
        href="https://www.territoiresentransitions.fr/"
        onClick={() => trackEvent(Event.accueil.viewSite)}
      >
        Retourner sur le site
      </Button>
    </PageContainer>
  );
};

export default Accueil;
