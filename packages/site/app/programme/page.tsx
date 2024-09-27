'use server';

import Services from './Services';
import Benefices from './Benefices';
import Etapes from './Etapes';
import ProgrammeBanner from './ProgrammeBanner';
import NoResult from '@tet/site/components/info/NoResult';
import { getStrapiData } from './utils';
import { Metadata, ResolvingMetadata } from 'next';
import { getUpdatedMetadata } from '@tet/site/src/utils/getUpdatedMetadata';
import Contact from './Contact';
import Compte from './Compte';
import CollectivitesEngagees from './CollectivitesEngagees';

export async function generateMetadata(
  params: { params: unknown },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const metadata = (await parent) as Metadata;
  const strapiData = await getStrapiData();

  return getUpdatedMetadata(metadata, {
    title: strapiData?.seo.metaTitle ?? 'Programme',
    networkTitle: strapiData?.seo.metaTitle,
    description: strapiData?.seo.metaDescription ?? strapiData?.description,
    image: strapiData?.seo.metaImage,
  });
}

const Programme = async () => {
  const data = await getStrapiData();

  return data ? (
    <>
      <ProgrammeBanner
        titre={data.titre}
        description={data.description}
        couvertureURL={data.couvertureURL}
      />

      <Benefices {...data.benefices} />

      <Contact {...data.contact} />

      <Etapes {...data.etapes} />

      <Services {...data.services} />

      <CollectivitesEngagees {...data.collectivites} />

      <Compte {...data.compte} />
    </>
  ) : (
    <NoResult />
  );
};

export default Programme;
