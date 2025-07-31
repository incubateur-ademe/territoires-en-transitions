'use server';

import LabellisationLogo from '@/site/components/labellisation/LabellisationLogo';
import Section from '@/site/components/sections/Section';
import { getUpdatedMetadata } from '@/site/src/utils/getUpdatedMetadata';
import { natureCollectiviteToLabel } from '@/site/src/utils/labels';
import classNames from 'classnames';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import {
  fetchCollectivite,
  getStrapiData,
  getStrapiDefaultData,
} from '../../utils';
import AccesCompte from './AccesCompte';
import CollectiviteHeader from './CollectiviteHeader';
import ContenuCollectivite from './ContenuCollectivite';
import HistoriqueLabellisation from './HistoriqueLabellisation';
import IndicateursCollectivite from './IndicateursCollectivite';
import PageContent from './PageContent';

export async function generateMetadata(
  { params }: { params: Promise<{ code: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { code } = await params;
  const metadata = (await parent) as Metadata;
  const collectiviteData = await fetchCollectivite(code);
  const strapiData = await getStrapiData(code);
  const strapiDefaultData = await getStrapiDefaultData();
  const couverture = strapiData?.couverture?.attributes ?? undefined;

  if (!collectiviteData || !collectiviteData.collectivite.nom) return metadata;

  return getUpdatedMetadata(metadata, {
    title:
      strapiData?.seo.metaTitle ??
      strapiDefaultData?.seo.metaTitle ??
      collectiviteData.collectivite.nom,
    networkTitle:
      strapiData?.seo.metaTitle ??
      strapiDefaultData?.seo.metaTitle ??
      collectiviteData.collectivite.nom,
    description:
      strapiData?.seo.metaDescription ?? strapiDefaultData?.seo.metaDescription,
    image: strapiData?.seo.metaImage
      ? strapiData.seo.metaImage
      : couverture
      ? {
          url: couverture.url as unknown as string,
          width: couverture.width as unknown as number,
          height: couverture.height as unknown as number,
          type: couverture.mime as unknown as string,
          alt: couverture.alternativeText as unknown as string,
        }
      : strapiDefaultData?.seo.metaImage,
  });
}

const DetailCollectivite = async ({
  params,
}: {
  params: Promise<{ code: string }>;
}) => {
  const { code } = await params;
  const collectiviteData = await fetchCollectivite(code);
  const strapiData = await getStrapiData(code);
  const strapiDefaultData = await getStrapiDefaultData();

  if (!collectiviteData || !collectiviteData.collectivite.nom)
    return notFound();

  // Evite un doublon pour la page de Strasbourg
  if (code === '67482') redirect(`/collectivites/246700488`);

  return (
    <Section
      containerClassName="grow bg-primary-1 max-md:!py-0"
      className="max-md:px-0 grid grid-cols-11 !gap-0 md:!gap-10 xl:!gap-12"
    >
      {/* Bannière avec nom de la collectivité et photo */}
      <div
        className={classNames('col-span-full', {
          'lg:col-span-8': collectiviteData.collectivite.labellisee,
        })}
      >
        <CollectiviteHeader
          collectivite={{
            ...collectiviteData.collectivite,
            ...strapiData,
            type:
              natureCollectiviteToLabel[
                collectiviteData.collectivite.nature_collectivite
              ] ?? collectiviteData.collectivite.type_collectivite,
            couvertureDefaut: strapiDefaultData?.couverture,
            annuaireUrl: collectiviteData.annuaireUrl,
          }}
        />
      </div>

      {/* Colonne de droite avec niveau de labellisation et bloc de connexion */}
      <div
        className={classNames(
          'col-span-full md:col-span-4 lg:col-span-3 lg:row-span-2 md:max-lg:order-last flex flex-col md:gap-10 xl:gap-12',
          { 'lg:order-last': !collectiviteData.collectivite.labellisee }
        )}
      >
        {collectiviteData.collectivite.labellisee && (
          <div className="flex flex-col items-center md:rounded-[10px] bg-white pt-6 pb-10 px-2">
            <LabellisationLogo
              cae={collectiviteData.collectivite.cae_etoiles ?? undefined}
              eci={collectiviteData.collectivite.eci_etoiles ?? undefined}
            />
          </div>
        )}
        {collectiviteData.collectivite.labellisations.length > 0 && (
          <>
            <HistoriqueLabellisation
              referentiel="cae"
              historique={collectiviteData.collectivite.labellisations.filter(
                (label) => label.referentiel === 'cae' && label.annee !== null
              )}
            />
            <HistoriqueLabellisation
              referentiel="eci"
              historique={collectiviteData.collectivite.labellisations.filter(
                (label) => label.referentiel === 'eci' && label.annee !== null
              )}
            />
          </>
        )}
        {collectiviteData.collectivite.active ? (
          <AccesCompte
            description={
              strapiDefaultData?.connexion?.description ??
              'Vous êtes membre de cette collectivité ?'
            }
            cta={strapiDefaultData?.connexion?.cta ?? 'Se connecter'}
            href="https://auth.territoiresentransitions.fr/login"
          />
        ) : (
          <AccesCompte
            description={
              strapiDefaultData?.inscription?.description ??
              'Faites un pas supplémentaire vers la transition écologique en créant un compte gratuit'
            }
            cta={strapiDefaultData?.inscription?.cta ?? 'Créer un compte'}
            href="https://auth.territoiresentransitions.fr/signup"
          />
        )}
      </div>

      {/* Contenu */}
      <PageContent
        indicateurs={
          strapiDefaultData ? (
            <IndicateursCollectivite
              defaultData={strapiDefaultData.indicateurs}
              indicateurs={{
                artificialisation_sols:
                  collectiviteData.collectivite.indicateur_artificialisation,
                gaz_effet_serre:
                  collectiviteData.collectivite.indicateurs_gaz_effet_serre,
              }}
            />
          ) : null
        }
        programme={
          strapiData?.contenu ? (
            <ContenuCollectivite contenu={strapiData.contenu} />
          ) : null
        }
      />
    </Section>
  );
};

export default DetailCollectivite;
