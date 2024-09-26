'use server';

import NoResult from '@components/info/NoResult';
import {getStrapiData} from './utils';
import HeaderTrajectoire from './HeaderTrajectoire';
import PresentationTrajectoire from './PresentationTrajectoire';
import Methode from './Methode';
import Webinaire from './Webinaire';
import Calcul from './Calcul';
import Documentation from './Documentation';
import TemoignagesTrajectoire from './TemoignagesTrajectoire';
import {Metadata, ResolvingMetadata} from 'next';
import {getUpdatedMetadata} from 'src/utils/getUpdatedMetadata';

export async function generateMetadata(
  {params}: {params: {}},
  parent: ResolvingMetadata,
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
