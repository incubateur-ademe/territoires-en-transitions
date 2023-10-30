'use server';

import {Metadata} from 'next';
import classNames from 'classnames';
import {fetchCollectivite, getStrapiData} from '../../utils';
import Gallery from '@components/gallery/Gallery';
import Section from '@components/sections/Section';
import EmbededVideo from '@components/video/EmbededVideo';
import ActionCollectivite from './ActionCollectivite';
import CollectiviteHeader from './CollectiviteHeader';
import ConnexionCompte from './ConnexionCompte';
import CreationCompte from './CreationCompte';
import LabellisationLogo from './LabellisationLogo';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Collectivités',
  };
}

const DetailCollectivite = async ({params}: {params: {code: string}}) => {
  const collectiviteData = await fetchCollectivite(params.code);
  const strapiData = await getStrapiData(params.code);

  if (!collectiviteData || !collectiviteData.nom) return null;

  return (
    <Section
      containerClassName="bg-primary-1 max-md:!py-0"
      className="max-md:px-0 grid grid-cols-11 !gap-0 md:!gap-10 xl:!gap-12"
    >
      {/* Bannière avec nom de la collectivité et photo */}
      <div
        className={classNames('col-span-full', {
          'lg:col-span-8': collectiviteData.active,
        })}
      >
        <CollectiviteHeader
          nom={collectiviteData.nom}
          region={collectiviteData.region_name ?? undefined}
          departement={collectiviteData.departement_name ?? undefined}
          type={collectiviteData.type_collectivite ?? undefined}
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
          {'lg:order-last': !collectiviteData.active},
        )}
      >
        {collectiviteData.active ? (
          <>
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
            <ConnexionCompte />
          </>
        ) : (
          <CreationCompte />
        )}
      </div>

      {/* Contenu */}
      {strapiData?.contenu ? (
        <div className="col-span-full md:col-span-7 lg:col-span-8 flex flex-col gap-10 xl:gap-12">
          {strapiData.contenu.video && (
            <EmbededVideo
              url={strapiData.contenu.video}
              className={classNames('w-full md:rounded-[10px]', {
                'order-last': !strapiData.contenu.video_en_haut,
              })}
            />
          )}
          {strapiData.contenu.actions.length > 0 &&
            strapiData.contenu.actions.map(action => (
              <ActionCollectivite key={action.id} action={action} />
            ))}
        </div>
      ) : (
        <Gallery
          className="col-span-full md:col-span-7 lg:col-span-8"
          maxCols={2}
          breakpoints={{md: 768, lg: 1024}}
          gap="gap-0 md:gap-10 xl:gap-12"
          data={[
            <div key={1} className="bg-white md:rounded-[10px]">
              test 1
            </div>,
            <div key={2} className="bg-white md:rounded-[10px]">
              test 2
            </div>,
          ]}
        />
      )}
    </Section>
  );
};

export default DetailCollectivite;
