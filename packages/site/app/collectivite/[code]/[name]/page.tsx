'use server';

import {Metadata} from 'next';
import classNames from 'classnames';
import {
  fetchCollectivite,
  getStrapiData,
  getStrapiDefaultData,
} from '../../utils';
import Section from '@components/sections/Section';
import CollectiviteHeader from './CollectiviteHeader';
import LabellisationLogo from './LabellisationLogo';
import ContenuCollectivite from './ContenuCollectivite';
import IndicateursCollectivite from './IndicateursCollectivite';
import {natureCollectiviteToLabel} from './labels';
import AccesCompte from './AccesCompte';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Collectivités',
  };
}

const DetailCollectivite = async ({params}: {params: {code: string}}) => {
  const collectiviteData = await fetchCollectivite(params.code);
  const strapiData = await getStrapiData(params.code);
  const strapiDefaultData = await getStrapiDefaultData();

  if (!collectiviteData || !collectiviteData.nom) return null;

  return (
    <Section
      containerClassName="bg-primary-1 max-md:!py-0"
      className="max-md:px-0 grid grid-cols-11 !gap-0 md:!gap-10 xl:!gap-12"
    >
      {/* Bannière avec nom de la collectivité et photo */}
      <div
        className={classNames('col-span-full', {
          'lg:col-span-8': collectiviteData.labellisee,
        })}
      >
        <CollectiviteHeader
          nom={collectiviteData.nom}
          region={collectiviteData.region_name ?? undefined}
          regionCode={collectiviteData.region_code ?? undefined}
          departement={collectiviteData.departement_name ?? undefined}
          departementCode={collectiviteData.departement_code ?? undefined}
          type={
            ['commune', 'CC', 'CA', 'CU', 'EPT', 'METRO', 'PETR'].includes(
              collectiviteData.nature_collectivite,
            )
              ? natureCollectiviteToLabel[collectiviteData.nature_collectivite]
              : collectiviteData.type_collectivite
          }
          population={collectiviteData.population_totale ?? undefined}
          url={strapiData?.url}
          couverture={strapiData?.couverture}
          logo={strapiData?.logo}
        />
      </div>

      {/* Colonne de droite avec niveau de labellisation et bloc de connexion */}
      <div
        className={classNames(
          'col-span-full md:col-span-4 lg:col-span-3 md:max-lg:order-last flex flex-col md:gap-10 xl:gap-12',
          {'lg:order-last': !collectiviteData.labellisee},
        )}
      >
        {collectiviteData.labellisee && (
          <div className="flex flex-col items-center md:rounded-[10px] bg-white pt-6 pb-10 px-2">
            <LabellisationLogo
              cae={
                (collectiviteData.cae_etoiles as 0 | 1 | 2 | 3 | 4 | 5) ??
                undefined
              }
              eci={
                (collectiviteData.eci_etoiles as 0 | 1 | 2 | 3 | 4 | 5) ??
                undefined
              }
            />
          </div>
        )}
        {collectiviteData.active ? (
          <AccesCompte
            description={
              strapiDefaultData?.connexion?.description ??
              'Vous êtes membre de cette collectivité ?'
            }
            cta={strapiDefaultData?.connexion?.cta ?? 'Se connecter'}
            href="https://app.territoiresentransitions.fr/auth/signin"
          />
        ) : (
          <AccesCompte
            description={
              strapiDefaultData?.inscription?.description ??
              'Faites un pas supplémentaire vers la transition écologique en créant un compte gratuit'
            }
            cta={strapiDefaultData?.inscription?.cta ?? 'Créer un compte'}
            href="https://app.territoiresentransitions.fr/auth/signup"
          />
        )}
      </div>

      {/* Contenu */}
      {strapiData?.contenu ? (
        <ContenuCollectivite contenu={strapiData.contenu} />
      ) : strapiDefaultData ? (
        <IndicateursCollectivite
          defaultData={strapiDefaultData}
          indicateurs={{
            gaz_effet_serre: collectiviteData.indicateurs_gaz_effet_serre,
          }}
        />
      ) : (
        <div className="col-span-full md:col-span-7 lg:col-span-8" />
      )}
    </Section>
  );
};

export default DetailCollectivite;
