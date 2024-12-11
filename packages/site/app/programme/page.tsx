'use server';

import { TrackPageView } from '@/ui';
import NoResult from '@tet/site/components/info/NoResult';
import { getUpdatedMetadata } from '@tet/site/src/utils/getUpdatedMetadata';
import { Metadata, ResolvingMetadata } from 'next';
import Benefices from './Benefices';
import CollectivitesEngagees from './CollectivitesEngagees';
import Compte from './Compte';
import Contact from './Contact';
import Etapes from './Etapes';
import ProgrammeBanner from './ProgrammeBanner';
import Services from './Services';
import { getStrapiData } from './utils';

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

  return (
    <>
      <TrackPageView pageName={'site/programme'} properties={{}} />

      {data ? (
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
      )}
    </>
  );
};

export default Programme;
