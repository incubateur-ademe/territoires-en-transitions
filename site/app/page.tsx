import ActiveUsers from './ActiveUsers';
import Map from './CollectiviteCarto';
import EvolutionTotalActivationParType
  from './EvolutionTotalActivationParType';
import CollectiviteActivesEtTotalParType
  from './CollectiviteActivesEtTotalParType';

export default function Home() {
  return <div className="fr-container-fluid">

    <section className="fr-container">
      <h1>Statistiques</h1>
      <p>Territoires en Transitions est une plateforme publique gratuite et
        open-source développée avec ses utilisateurs afin d’aider les
        collectivités dans le pilotage et la priorisation de leur transition
        écologique.</p>
      <h2>Déployer la transition écologique sur la totalité du territoire
        national</h2>
      <p>La transition écologique nécessite d’être déployée sur la totalité des
        intercommunalités (1254 EPCI à fiscalité propre au 1er janvier 2022)
        ainsi que leurs communes et syndicats associés qui ont une
        responsabilité directe ainsi qu’une influence forte sur la planification
        et la mise en œuvre de la transition écologique à l’échelle locale.
        <br />Les statistiques suivantes présentent le nombre de collectivités
        activées sur la plateforme. Une collectivité est considérée comme
        activée lorsqu’au moins une personne utilisatrice a été rattachée à
        cette collectivité sur la plateforme.</p>

      <EvolutionTotalActivationParType />


      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-6">
          <CollectiviteActivesEtTotalParType />
        </div>
        <div className="fr-col-6 fr-ratio-1x1">
          <Map />
        </div>
      </div>
    </section>

    <section className="fr-container">
      <h2>Outiller les personnes chargées de la planification écologique</h2>
      <p>La transition écologique est un sujet transversal et systémique qui
        concerne de nombreuses personnes au sein d’une collectivité : les
        différente personnes chargées de mission (climat, économie circulaire,
        urbanisme, mobilités, biodiversité…), coordinatrices de programmes, des
        services techniques, ainsi que les partenaires et prestataires avec
        lesquels travaille la collectivité. La plateforme facilite la
        collaboration entre les personnes qui travaillent au sein d’une même
        équipe pour faire avancer l’action de la collectivité.</p>
      <ActiveUsers />
    </section>

    <section className="fr-container">
      <h2>Connaître l’état des lieux des forces et faiblesses de chaque
        territoire</h2>
      <p>L’état des lieux (ou diagnostic) est une étape incontournable dans
        toute
        démarche de planification. Pour accompagner les collectivités dans cet
        exercice, la plateforme Territoires en Transitions s’appuie sur les
        référentiels de l’ADEME sur les thématiques Climat, Air, Energie et
        Économie Circulaire.</p>
    </section>

    <section className="fr-container">
      <h1>Planifier et prioriser les actions en faveur de la transition
        écologique</h1>
      <p>Pour suivre la progression des actions décidées, les collectivités sont
        amenées à suivre de nombreux plans d’actions politiques et
        réglementaires
        tels que des Plans de Transition Écologique, Plans Climat Air Énergie
        Territoriaux (PCAET), Plans économie circulaire, Plans de mobilité,
        Plans
        vélo, etc. Elles ont besoin d’un outil qui leur permette de suivre la
        progression des actions prévues dans ces plans.</p>

    </section>

    <section className="fr-container">
      <h2>Suivre les indicateurs clés de réalisation et d’impact de la
        transition
        écologique</h2>
      <p>Afin d’objectiver la progression des actions les collectivités mesurent
        la progression au moyen d’indicateurs de réalisation et d’impact de
        référence ou personnalisés.</p>
    </section>

    <section className="fr-container">
      <h2>Partager et valoriser la progression de chaque territoire</h2>
      <p>Lorsqu’elles réalisent leur état des lieux sur la plateforme, les
        collectivités évaluent leur performance au regard des référentiels
        nationaux. Elles obtiennent ainsi un score qui leur permet d’accéder à
        la
        labellisation “Territoire Engagé Transition Ecologique”.</p>
    </section>
  </div>;
}
