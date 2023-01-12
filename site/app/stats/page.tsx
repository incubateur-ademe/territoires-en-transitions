'use client';

import {fr} from '@codegouvfr/react-dsfr';
import {ChartHead, SectionHead, ChartTitle} from './headings';
import {EtatDesLieux} from './EtatDesLieux';
import {EvolutionPlansAction} from './EvolutionPlansAction';
import {EvolutionIndicateurs} from './EvolutionIndicateurs';
import ActiveUsers from './ActiveUsers';
import CarteEpciParDepartement from './CarteEpciParDepartement';
import EvolutionTotalActivationParType from './EvolutionTotalActivationParType';
import CollectiviteActivesEtTotalParType from './CollectiviteActivesEtTotalParType';
import NombreUtilisateurParCollectivite from './NombreUtilisateurParCollectivite';
import NombreCollectivitesEngagees from './NombreCollectivitesEngagees';
import CollectivitesLabellisees from './CollectivitesLabellisees';

export default function Stats() {
  return (
    <div className="fr-container-fluid">
      <section className="fr-container">
        <h1 className={fr.cx('fr-mt-4w')}>Statistiques</h1>
        <p>
          Territoires en Transitions est une plateforme publique gratuite et
          open-source développée avec ses utilisateurs afin d’aider les
          collectivités dans le pilotage et la priorisation de leur transition
          écologique.
        </p>
        <h2>
          Déployer la transition écologique sur la totalité du territoire
          national
        </h2>
        <p>
          La transition écologique nécessite d’être déployée sur la totalité des
          intercommunalités (1254 EPCI à fiscalité propre au 1er janvier 2022)
          ainsi que leurs communes et syndicats associés qui ont une
          responsabilité et une influence forte sur la planification et la mise
          en œuvre de la transition écologique à l’échelle locale.
          <br />
          Les statistiques suivantes présentent le nombre de collectivités
          activées sur la plateforme. Une collectivité est considérée comme
          activée lorsqu’au moins une personne utilisatrice a été rattachée à
          cette collectivité sur la plateforme.
        </p>

        <EvolutionTotalActivationParType />

        <ChartHead>
          Progression de l’activation des EPCI sur le territoire national
        </ChartHead>
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-xs-12 fr-col-sm-12 fr-col-md-4 fr-col-lg-4 fr-ratio-1x1">
            <ChartTitle>Nombre EPCI actifs</ChartTitle>
            <CarteEpciParDepartement valeur="actives" maximum="actives_max" />
          </div>
          <div className="fr-col-xs-12 fr-col-sm-12 fr-col-md-4 fr-col-lg-4 fr-ratio-1x1">
            <ChartTitle>Pourcentage EPCI actifs</ChartTitle>
            <CarteEpciParDepartement valeur="ratio" maximum="ratio_max" />
          </div>
          <div className="fr-col-xs-12 fr-col-sm-12 fr-col-md-4 fr-col-lg-4 fr-ratio-1x1">
            <ChartTitle>Progression globale</ChartTitle>
            <CollectiviteActivesEtTotalParType />
          </div>
        </div>
      </section>

      <section className="fr-container">
        <SectionHead>
          Outiller les personnes chargées de la planification écologique
        </SectionHead>
        <p>
          La transition écologique est un sujet transversal et systémique qui
          concerne de nombreuses personnes au sein d’une collectivité : les
          différent(e)s chargé(e)s de mission (climat, économie circulaire,
          urbanisme, mobilités, biodiversité…), coordinatrices de programmes,
          des services techniques, ainsi que les partenaires et prestataires
          avec lesquels travaille la collectivité. La plateforme facilite la
          collaboration entre les personnes qui travaillent au sein d’une même
          équipe pour faire avancer l’action de la collectivité.
        </p>
        <ActiveUsers />
        <NombreUtilisateurParCollectivite />
      </section>

      <section className="fr-container">
        <SectionHead>
          Connaître l’état des lieux des forces et faiblesses de chaque
          territoire
        </SectionHead>
        <p>
          L’état des lieux est une étape incontournable dans toute démarche de
          planification. Pour accompagner les collectivités dans cet exercice,
          la plateforme Territoires en Transitions s’appuie sur les référentiels
          Climat, Air, Energie et Economie Circulaire de l’ADEME.
        </p>
        <EtatDesLieux />
      </section>

      <section className="fr-container">
        <SectionHead>
          Planifier et prioriser les actions en faveur de la transition
          écologique
        </SectionHead>
        <p>
          Pour suivre la progression des actions décidées, les collectivités
          sont amenées à suivre de nombreux plans d’actions politiques et
          réglementaires tels que des Plans de Transition Écologique, Plans
          Climat Air Énergie Territoriaux (PCAET), Plans économie circulaire,
          Plans de mobilité, Plans vélo, etc. Elles ont besoin d’un outil qui
          leur permette de suivre la progression des actions prévues dans ces
          plans.
        </p>
        <EvolutionPlansAction />
      </section>

      <section className="fr-container">
        <SectionHead>
          Suivre les indicateurs clés de réalisation et d’impact de la
          transition écologique
        </SectionHead>
        <p>
          Afin d’objectiver la progression des actions les collectivités
          mesurent la progression au moyen d’indicateurs de réalisation et
          d’impact de référence ou personnalisés.
        </p>
        <EvolutionIndicateurs />
      </section>

      <section className="fr-container">
        <SectionHead>
          Partager et valoriser la progression de chaque territoire
        </SectionHead>
        <p>
          Lorsqu’elles réalisent leur état des lieux sur la plateforme, les
          collectivités évaluent leur performance au regard des référentiels
          nationaux. Elles obtiennent ainsi un score qui leur permet d’accéder à
          la labellisation “Territoire Engagé Transition Ecologique”.
        </p>
        <NombreCollectivitesEngagees />
        <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
          <div className="fr-col-xs-12 fr-col-sm-12 fr-col-md-5 fr-col-lg-5">
            <ChartTitle>
              Nombre de labellisés CAE par niveau de labellisation
            </ChartTitle>
            <CollectivitesLabellisees referentiel="cae" />
          </div>
          <div className="fr-col-xs-12 fr-col-sm-12 fr-col-md-5 fr-col-lg-5">
            <ChartTitle>
              Nombre de labellisés ECI par niveau de labellisation
            </ChartTitle>
            <CollectivitesLabellisees referentiel="eci" />
          </div>
        </div>
      </section>
    </div>
  );
}
