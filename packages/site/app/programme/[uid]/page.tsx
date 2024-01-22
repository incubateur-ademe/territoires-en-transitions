'use server';

import {notFound} from 'next/navigation';
import {getServiceStrapiData} from './utils';
import {InfoData, ListeData, ParagrapheData} from './types';
import ParagrapheService from './ParagrapheService';
import ListeService from './ListeService';
import InfoService from './InfoService';
import {Metadata, ResolvingMetadata} from 'next';
import {getUpdatedMetadata} from 'src/utils/getUpdatedMetadata';

export async function generateMetadata(
  {params}: {params: {uid: string}},
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const metadata = (await parent) as Metadata;
  const strapiData = await getServiceStrapiData(params.uid);

  return getUpdatedMetadata(metadata, {
    title: strapiData?.seo.metaTitle,
    networkTitle: strapiData?.seo.metaTitle,
    description: strapiData?.seo.metaDescription,
    image: strapiData?.seo.metaImage,
  });
}

type ServiceProgrammeProps = {
  params: {uid: string};
};

const ServiceProgramme = async ({params: {uid}}: ServiceProgrammeProps) => {
  const data = await getServiceStrapiData(uid);

  if (!data || data.contenu.length === 0) return notFound();

  return (
    <>
      {data.contenu.map(c => {
        switch (c.type) {
          case 'paragraphe':
            return <ParagrapheService {...(c as ParagrapheData)} />;
          case 'liste':
            return <ListeService {...(c as ListeData)} />;
          case 'info':
            return <InfoService {...(c as InfoData)} />;
          default:
            return notFound();
        }
      })}
    </>
  );
};

export default ServiceProgramme;
