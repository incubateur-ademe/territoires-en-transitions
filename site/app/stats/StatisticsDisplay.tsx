'use client';

import {fr} from '@codegouvfr/react-dsfr';
import EvolutionTotalActivationParType from './EvolutionTotalActivationParType';
import {SectionHead} from './headings';
import RegionAndDeptFilters from './RegionAndDeptFilters';

type StatisticsDisplayProps = {
  regionCode: string;
};

const StatisticsDisplay = ({regionCode}: StatisticsDisplayProps) => {
  return (
    <div className="fr-container-fluid">
      <section className="fr-container">
        <h1 className={fr.cx('fr-mt-4w')}>Statistiques</h1>
        <RegionAndDeptFilters />

        <p>
          Cette page présente les statistiques de déploiement et d’usage
          régionales de la plateforme Territoires en Transitions.
        </p>

        <SectionHead>
          Déployer la transition écologique sur la totalité du territoire
        </SectionHead>
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

        <EvolutionTotalActivationParType region={regionCode} />
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
      </section>
    </div>
  );
};

export default StatisticsDisplay;
