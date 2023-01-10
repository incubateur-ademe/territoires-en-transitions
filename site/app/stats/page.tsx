'use client';

import { fr } from '@codegouvfr/react-dsfr';
import { ThemeProvider } from '@nivo/core';
import { theme } from './shared';
import ActiveUsers from './ActiveUsers';
import CarteEpciParDepartement from './CarteEpciParDepartement';
import EvolutionTotalActivationParType from './EvolutionTotalActivationParType';
import CollectiviteActivesEtTotalParType from './CollectiviteActivesEtTotalParType';
import NombreUtilisateurParCollectivite from './NombreUtilisateurParCollectivite';
import TrancheCompletude from './TrancheCompletude';
import EvolutionFiches from './EvolutionFiches';
import IndicateursRenseignes from './IndicateursRenseignes';
import { CSSProperties } from 'react';

type TextAlign = CSSProperties['textAlign'];
const display = { marginTop: fr.spacing('20v') };
const chartHead = {
  marginTop: fr.spacing('10v'),
  textAlign: 'center' as TextAlign,
};
const chartTitle = { textAlign: 'center' as TextAlign, display: 'block' };

export default function Stats() {
  return (
    <ThemeProvider theme={theme}>
      <div className="fr-container-fluid">
        <section className="fr-container">
          <h1 style={display}>Statistiques</h1>
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
            La transition écologique nécessite d’être déployée sur la totalité
            des intercommunalités (1254 EPCI à fiscalité propre au 1er janvier
            2022) ainsi que leurs communes et syndicats associés qui ont une
            responsabilité et une influence forte sur la planification et la
            mise en œuvre de la transition écologique à l’échelle locale.
            <br />
            Les statistiques suivantes présentent le nombre de collectivités
            activées sur la plateforme. Une collectivité est considérée comme
            activée lorsqu’au moins une personne utilisatrice a été rattachée à
            cette collectivité sur la plateforme.
          </p>

          <EvolutionTotalActivationParType />

          <h6 style={chartHead}>
            Progression de l’activation des EPCI sur le territoire national
          </h6>
          <div className="fr-grid-row fr-grid-row--center">
            <div className="fr-col-4 fr-ratio-1x1">
              <em style={chartTitle}>Nombre EPCI actifs</em>
              <CarteEpciParDepartement valeur="actives" maximum="actives_max" />
            </div>
            <div className="fr-col-4 fr-ratio-1x1">
              <em style={chartTitle}>Pourcentage EPCI actifs</em>
              <CarteEpciParDepartement valeur="ratio" maximum="ratio_max" />
            </div>
            <div className="fr-col-4 fr-ratio-1x1">
              <em style={chartTitle}>Progression globale</em>
              <CollectiviteActivesEtTotalParType />
            </div>
          </div>
        </section>

        <section className="fr-container">
          <h2 style={display}>
            Outiller les personnes chargées de la planification écologique
          </h2>
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
          <div style={chartHead} />
          <NombreUtilisateurParCollectivite />
        </section>

        <section className="fr-container">
          <h2 style={display}>
            Connaître l’état des lieux des forces et faiblesses de chaque
            territoire
          </h2>
          <p>
            L’état des lieux est une étape incontournable dans toute démarche de
            planification. Pour accompagner les collectivités dans cet exercice,
            la plateforme Territoires en Transitions s’appuie sur les
            référentiels Climat, Air, Energie et Economie Circulaire de l'ADEME.
          </p>

          <h6 style={chartHead}>
            États des lieux réalisés ventilés par taux de progression
          </h6>
          <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
            <div className="fr-col-5 fr-ratio-1x1">
              <em style={chartTitle}>Économie circulaire</em>
              <TrancheCompletude referentiel="eci" />
            </div>
            <div className="fr-col-5 fr-ratio-1x1">
              <em style={chartTitle}>Climat Air Énergie</em>
              <TrancheCompletude referentiel="cae" />
            </div>
          </div>
        </section>

        <section className="fr-container">
          <h2 style={display}>
            Planifier et prioriser les actions en faveur de la transition
            écologique
          </h2>
          <p>
            Pour suivre la progression des actions décidées, les collectivités
            sont amenées à suivre de nombreux plans d’actions politiques et
            réglementaires tels que des Plans de Transition Écologique, Plans
            Climat Air Énergie Territoriaux (PCAET), Plans économie circulaire,
            Plans de mobilité, Plans vélo, etc. Elles ont besoin d’un outil qui
            leur permette de suivre la progression des actions prévues dans ces
            plans.
          </p>

          <h6 style={chartHead}>
            Évolution de l&apos;utilisation des plans d&apos;action
          </h6>
          <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
            <div className="fr-col-6 fr-ratio-3x2">
              <em style={chartTitle}>Nombre de collectivités avec 5+ fiches</em>
              <EvolutionFiches vue="stats_evolution_collectivite_avec_minimum_fiches" />
            </div>
            <div className="fr-col-6 fr-ratio-3x2">
              <em style={chartTitle}>Nombre de fiches action crées</em>
              <EvolutionFiches vue="stats_evolution_nombre_fiches" />
            </div>
          </div>
        </section>

        <section className="fr-container">
          <h2 style={display}>
            Suivre les indicateurs clés de réalisation et d’impact de la
            transition écologique
          </h2>
          <p>
            Afin d’objectiver la progression des actions les collectivités
            mesurent la progression au moyen d’indicateurs de réalisation et
            d’impact de référence ou personnalisés.
          </p>
          <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
            <div className="fr-col-6 fr-ratio-3x2">
              <em style={chartTitle}>
                Nombre d’indicateurs des référentiels renseignés
              </em>
              <IndicateursRenseignes />
            </div>
          </div>
        </section>

        <section className="fr-container">
          <h2 style={display}>
            Partager et valoriser la progression de chaque territoire
          </h2>
          <p>
            Lorsqu’elles réalisent leur état des lieux sur la plateforme, les
            collectivités évaluent leur performance au regard des référentiels
            nationaux. Elles obtiennent ainsi un score qui leur permet d’accéder
            à la labellisation “Territoire Engagé Transition Ecologique”.
          </p>
        </section>
      </div>
    </ThemeProvider>
  );
}
