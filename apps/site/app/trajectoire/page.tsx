'use server';

import NoResult from '@/site/components/info/NoResult';
import { getUpdatedMetadata } from '@/site/src/utils/getUpdatedMetadata';
import { Metadata, ResolvingMetadata } from 'next';
import Calcul from './Calcul';
import Documentation from './Documentation';
import HeaderTrajectoire from './HeaderTrajectoire';
import Methode from './Methode';
import PresentationTrajectoire from './PresentationTrajectoire';
import TemoignagesTrajectoire from './TemoignagesTrajectoire';
import { getStrapiData } from './utils';
import Webinaire from './Webinaire';

export async function generateMetadata(
  _: { params: Promise<unknown> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const metadata = (await parent) as Metadata;
  const strapiData = await getStrapiData();

  return getUpdatedMetadata(metadata, {
    title: strapiData?.seo.metaTitle ?? 'Trajectoire SNBC',
    networkTitle: strapiData?.seo.metaTitle,
    description: strapiData?.seo.metaDescription ?? strapiData?.header.titre,
    image: strapiData?.seo.metaImage,
  });
}

const PageTrajectoire = async () => {
  const data = await getStrapiData();

  return data ? (
    <div className="grow">
      <HeaderTrajectoire {...data.header} />

      <PresentationTrajectoire {...data.presentation} />

      <Methode {...data.methode} />

      {data.webinaire.url && <Webinaire {...data.webinaire} />}

      <Calcul
        {...data.calcul}
        backgroundColor={data.webinaire.url ? 'bg-primary-1' : 'bg-primary-0'}
      />

      <TemoignagesTrajectoire temoignages={data.temoignages} />

      <Documentation {...data.documentation} />
    </div>
  ) : (
    <NoResult />
  );
};

export default PageTrajectoire;
