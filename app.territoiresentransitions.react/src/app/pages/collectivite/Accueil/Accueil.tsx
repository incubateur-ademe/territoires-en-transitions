import { useCurrentCollectivite } from 'core-logic/hooks/useCurrentCollectivite';
import { useAuth } from 'core-logic/api/auth/AuthProvider';
import CollectivitePageLayout from '@tet/app/pages/collectivite/CollectivitePageLayout/CollectivitePageLayout';
import SectionCard from '@tet/app/pages/collectivite/Accueil/SectionCard';
import {
  makeCollectivitePanierUrl,
  makeCollectivitePlansActionsNouveauUrl,
  makeCollectiviteSyntheseReferentielUrl,
  makeCollectiviteTousLesIndicateursUrl,
  makeCollectiviteToutesLesFichesUrl,
  makeCollectiviteTrajectoirelUrl,
  makeTableauBordUrl,
  recherchesCollectivitesUrl,
} from '@tet/app/paths';
import PictoEtatDesLieux from '@tet/app/pages/collectivite/Accueil/pictogrammes/PictoEtatDesLieux';
import PictoPlansAction from '@tet/app/pages/collectivite/Accueil/pictogrammes/PictoPlansAction';
import PictoIndicateurs from '@tet/app/pages/collectivite/Accueil/pictogrammes/PictoIndicateurs';
import PictoTrajectoire from '@tet/app/pages/collectivite/Accueil/pictogrammes/PictoTrajectoire';
import PictoCollectivite from '@tet/app/pages/collectivite/Accueil/pictogrammes/PictoCollectivite';
import PictoPanierActions from '@tet/app/pages/collectivite/Accueil/pictogrammes/PictoPanierActions';
import { Button } from '@tet/ui';
import { useNbActionsDansPanier } from '@tet/app/Layout/Header/AccesPanierAction';
import { useCreateFicheAction } from '@tet/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheAction';
import { useFicheActionCount } from '@tet/app/pages/collectivite/PlansActions/FicheAction/data/useFicheActionCount';
import { usePlanActionsCount } from '@tet/app/pages/collectivite/PlansActions/PlanAction/data/usePlanActionsCount';

/**
 * Affiche la page d'accueil d'une collectivité
 */
const Accueil = (): JSX.Element => {
  const collectivite = useCurrentCollectivite();

  const { user } = useAuth();

  const { mutate: createFicheAction } = useCreateFicheAction();

  const { count: planActionsCount } = usePlanActionsCount();

  const { count: ficheActionCount } = useFicheActionCount();

  const { data: panier } = useNbActionsDansPanier(
    collectivite?.collectivite_id!
  );

  if (!collectivite?.collectivite_id) return <></>;

  const { collectivite_id: collectiviteId } = collectivite;

  return (
    <main className="grow -mb-8 py-12 px-4 lg:px-6 bg-grey-2">
      <CollectivitePageLayout>
        <h2 className="mb-4">Bonjour {user?.prenom} !</h2>
        <div className="mb-12 text-lg text-grey-8">
          <p>
            Bienvenue sur Territoires en Transitions ! À la fois espace de
            travail personnel et collaboratif, la plateforme est là pour vous
            aider à accélérer la transition écologique de votre collectivité.
          </p>

          <p>
            Développée par l'ADEME en partenariat avec beta.gouv, elle s'adresse
            à toutes les collectivités.
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
                href: makeCollectiviteSyntheseReferentielUrl({
                  collectiviteId,
                }),
              },
              {
                children: "Plus d'informations sur le programme",
                href: 'https://www.territoiresentransitions.fr/programme',
                external: true,
                variant: 'outlined',
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
              collectivite.readonly
                ? {
                    children: 'Aller sur le tableau de bord de la collectivité',
                    href: makeTableauBordUrl({
                      collectiviteId,
                      view: 'collectivite',
                    }),
                  }
                : planActionsCount > 0
                ? {
                    children: 'Aller sur mon tableau de bord',
                    href: makeTableauBordUrl({
                      collectiviteId,
                      view: 'personnel',
                    }),
                  }
                : {
                    children: 'Créer mon 1er plan !',
                    href: makeCollectivitePlansActionsNouveauUrl({
                      collectiviteId,
                    }),
                  },
              ficheActionCount > 0
                ? {
                    children: 'Toutes les fiches action',
                    href: makeCollectiviteToutesLesFichesUrl({
                      collectiviteId,
                    }),
                    variant: 'outlined',
                  }
                : {
                    children: 'Créer une fiche action',
                    onClick: () => createFicheAction(),
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
              },
              {
                children: 'Découvrir les indicateurs disponibles en open data',
                href: `${makeCollectiviteTousLesIndicateursUrl({
                  collectiviteId,
                })}?od=true`,
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
              },
              {
                children: 'En savoir plus sur la confidentialité',
                href: 'https://aide.territoiresentransitions.fr/fr/article/la-confidentialite-sur-territoires-en-transitions-18gpnno/',
                variant: 'outlined',
                external: true,
              },
            ]}
          />
          <SectionCard
            picto={<PictoPanierActions />}
            title={
              panier && panier.count > 0
                ? `${panier.count} actions dans votre panier`
                : 'Panier d’actions'
            }
            description="Identifiez de nouvelles actions à mettre en place sur votre territoire pour accélérer la transition écologique."
            additionalInfos="Communes ou intercommunalités, quelque soit votre engagement actuel dans la transition écologique, constituez-vous une base d’actions adaptées à vos compétences."
            buttons={[
              panier && panier.count > 0
                ? {
                    children: 'Reprendre ma sélection d’actions',
                    href: makeCollectivitePanierUrl({ collectiviteId }),
                    external: true,
                  }
                : {
                    children: 'Tester le panier',
                    href: makeCollectivitePanierUrl({ collectiviteId }),
                    external: true,
                  },
            ]}
          />
        </div>
        <Button
          className="mt-20 mb-8 mx-auto"
          variant="outlined"
          href="https://www.territoiresentransitions.fr/"
        >
          Retourner sur le site
        </Button>
      </CollectivitePageLayout>
    </main>
  );
};

export default Accueil;
