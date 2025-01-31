'use server';

import { getUpdatedMetadata } from '@/site/src/utils/getUpdatedMetadata';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import InfoService from './InfoService';
import ListeService from './ListeService';
import ParagrapheService from './ParagrapheService';
import { InfoData, ListeData, ParagrapheData } from './types';
import { getServiceStrapiData } from './utils';

export async function generateMetadata(
  { params }: { params: Promise<{ uid: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const metadata = (await parent) as Metadata;
  const { uid } = await params;
  const strapiData = await getServiceStrapiData(uid);

  return getUpdatedMetadata(metadata, {
    title: strapiData?.seo.metaTitle,
    networkTitle: strapiData?.seo.metaTitle,
    description: strapiData?.seo.metaDescription,
    image: strapiData?.seo.metaImage,
  });
}

type ServiceProgrammeProps = {
  params: Promise<{ uid: string }>;
};

const ServiceProgramme = async ({ params }: ServiceProgrammeProps) => {
  const { uid } = await params;
  const data = await getServiceStrapiData(uid);

  if (!data || data.contenu.length === 0) return notFound();

  return (
    <>
      {data.contenu.map((c, i) => {
        const key = `${c.type}-${i}`;
        switch (c.type) {
          case 'paragraphe':
            return <ParagrapheService key={key} {...(c as ParagrapheData)} />;
          case 'liste':
            return <ListeService key={key} {...(c as ListeData)} />;
          case 'info':
            return <InfoService key={key} {...(c as InfoData)} />;
          default:
            return notFound();
        }
      })}
    </>
  );
};

export default ServiceProgramme;
