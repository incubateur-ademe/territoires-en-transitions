/* eslint-disable react/no-unescaped-entities */
'use client';

import { useCarteCollectivitesEngagees } from '@/site/components/carte/useCarteCollectivitesEngagees';
import Section from '@/site/components/sections/Section';
import dynamic from 'next/dynamic';
import ActiveUsers from './ActiveUsers';
import CollectiviteActivesEtTotalParType from './CollectiviteActivesEtTotalParType';
import CollectivitesLabellisees from './CollectivitesLabellisees';
import { EtatDesLieux } from './EtatDesLieux';
import EvolutionCollectivitesLabellisees from './EvolutionCollectivitesLabellisees';
import { EvolutionIndicateurs } from './EvolutionIndicateurs';
import { EvolutionPlansAction } from './EvolutionPlansAction';
import EvolutionTotalActivationParType from './EvolutionTotalActivationParType';
import { ChartTitle, SectionHead } from './headings';
import NombreCollectivitesEngagees from './NombreCollectivitesEngagees';
import NombreUtilisateurParCollectivite from './NombreUtilisateurParCollectivite';

/**
 * Affiche le contenu de la page statisques
 *
 * @param regionCode - (optionnel) Code de la région à afficher
 * @param depatmentCpde - (optionnel) Code du département à afficher
 */

type StatisticsDisplayProps = {
  regionCode?: string;
  departmentCode?: string;
};

const StatisticsDisplay = ({
  regionCode,
  departmentCode,
}: StatisticsDisplayProps) => {
  const { data } = useCarteCollectivitesEngagees();

  const nationalStats: boolean = !regionCode && !departmentCode;

  const CarteCollectivites = dynamic(
    () => import('../../components/carte/CarteCollectivites'),
    {
      ssr: false,
      loading: () => (
        <div className="w-[420px] h-[420px] mx-auto mt-14 flex items-center justify-center">
          <p>Chargement...</p>
        </div>
      ),
    }
  );

  return (
    <>
      <Section containerClassName="!py-28">
        <SectionHead>
          Déployer la transition écologique sur la totalité du territoire
          {nationalStats && ' national'}
        </SectionHead>
        <p className="paragraphe-18">
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

        <EvolutionTotalActivationParType
          region={regionCode}
          department={departmentCode}
        />

        <div className="flex justify-around flex-wrap gap-y-20">
          {nationalStats && (
            <div className="fr-col-xs-12 fr-col-sm-12 fr-col-md-4 fr-col-lg-4 fr-ratio-1x1">
              <ChartTitle>Collectivités actives</ChartTitle>
              <div className="w-[420px] h-[420px] mt-14">
                {data && (
                  <CarteCollectivites
                    filtre={'toutes'}
                    etoiles={[1, 2, 3, 4, 5]}
                    forcedZoom={5.3}
                    data={data}
                  />
                )}
              </div>
            </div>
          )}
          <div className="fr-col-xs-12 fr-col-sm-12 fr-col-md-4 fr-col-lg-4 fr-ratio-1x1">
            <ChartTitle>Progression globale de l'activation</ChartTitle>
            <CollectiviteActivesEtTotalParType />
          </div>
        </div>
      </Section>

      <Section containerClassName="bg-primary-0 !py-28">
        <SectionHead>
          Outiller les personnes chargées de la planification écologique
        </SectionHead>
        <p className="paragraphe-18">
          La transition écologique est un sujet transversal et systémique qui
          concerne de nombreuses personnes au sein d’une collectivité : les
          différent(e)s chargé(e)s de mission (climat, économie circulaire,
          urbanisme, mobilités, biodiversité…), coordinatrices de programmes,
          des services techniques, ainsi que les partenaires et prestataires
          avec lesquels travaille la collectivité. La plateforme facilite la
          collaboration entre les personnes qui travaillent au sein d’une même
          équipe pour faire avancer l’action de la collectivité.
        </p>
        <ActiveUsers region={regionCode} department={departmentCode} />
        <NombreUtilisateurParCollectivite
          region={regionCode}
          department={departmentCode}
        />
      </Section>

      <Section className="flex-col !py-28">
        <SectionHead>
          Connaître l’état des lieux des forces et faiblesses de chaque
          territoire
        </SectionHead>
        <p className="paragraphe-18">
          L’état des lieux est une étape incontournable dans toute démarche de
          planification. Pour accompagner les collectivités dans cet exercice,
          la plateforme Territoires en Transitions s’appuie sur les référentiels
          Climat, Air, Energie et Economie Circulaire de l’ADEME.
        </p>
        <EtatDesLieux region={regionCode} department={departmentCode} />
      </Section>

      <Section containerClassName="bg-primary-0 !py-28">
        <SectionHead>
          Planifier et prioriser les actions en faveur de la transition
          écologique
        </SectionHead>
        <p className="paragraphe-18">
          Pour suivre la progression des actions décidées, les collectivités
          sont amenées à suivre de nombreux plans d’actions politiques et
          réglementaires tels que des Plans de Transition Écologique, Plans
          Climat Air Énergie Territoriaux (PCAET), Plans économie circulaire,
          Plans de mobilité, Plans vélo, etc. Elles ont besoin d’un outil qui
          leur permette de suivre la progression des actions prévues dans ces
          plans.
        </p>
        <EvolutionPlansAction region={regionCode} department={departmentCode} />
      </Section>

      <Section containerClassName="!py-28">
        <SectionHead>
          Suivre les indicateurs clés de réalisation et d’impact de la
          transition écologique
        </SectionHead>
        <p className="paragraphe-18">
          Afin d’objectiver la progression des actions les collectivités
          mesurent la progression au moyen d’indicateurs de réalisation et
          d’impact de référence ou personnalisés.
        </p>
        <EvolutionIndicateurs region={regionCode} department={departmentCode} />
      </Section>

      <Section containerClassName="bg-primary-0 !py-28">
        <SectionHead>
          Partager et valoriser la progression de chaque territoire
        </SectionHead>
        <p className="paragraphe-18">
          Lorsqu’elles réalisent leur état des lieux sur la plateforme, les
          collectivités évaluent leur performance au regard des référentiels
          nationaux. Elles obtiennent ainsi un score qui leur permet d’accéder à
          la labellisation “Territoire Engagé Transition Ecologique”.
        </p>
        <NombreCollectivitesEngagees
          region={regionCode}
          department={departmentCode}
        />
        <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
          <div className="fr-col-xs-12 fr-col-sm-12 fr-col-md-5 fr-col-lg-5">
            <ChartTitle>
              Nombre de labellisés CAE par niveau de labellisation
            </ChartTitle>
            <CollectivitesLabellisees
              referentiel="cae"
              region={regionCode}
              department={departmentCode}
            />
          </div>
          <div className="fr-col-xs-12 fr-col-sm-12 fr-col-md-5 fr-col-lg-5">
            <ChartTitle>
              Nombre de labellisés ECI par niveau de labellisation
            </ChartTitle>
            <CollectivitesLabellisees
              referentiel="eci"
              region={regionCode}
              department={departmentCode}
            />
          </div>
        </div>
        {!regionCode && !departmentCode && (
          <EvolutionCollectivitesLabellisees
            region={regionCode}
            department={departmentCode}
          />
        )}
      </Section>
    </>
  );
};

export default StatisticsDisplay;
