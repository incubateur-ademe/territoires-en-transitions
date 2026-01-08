'use server';

import NoResult from '@/site/components/info/NoResult';
import Section from '@/site/components/sections/Section';
import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import { getUpdatedMetadata } from '@/site/src/utils/getUpdatedMetadata';
import { Alert } from '@tet/ui';
import { Metadata, ResolvingMetadata } from 'next';
import ContactForm from './ContactForm';
import { getStrapiData } from './utils';

export async function generateMetadata(
  params: { params: Promise<unknown> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const metadata = (await parent) as Metadata;
  const strapiData = await getStrapiData();

  return getUpdatedMetadata(metadata, {
    title: strapiData?.seo.metaTitle ?? 'Contact',
    networkTitle: strapiData?.seo.metaTitle,
    description: strapiData?.seo.metaDescription,
    image: strapiData?.seo.metaImage,
  });
}

const Contact = async () => {
  const data = await getStrapiData();

  if (!data) {
    return <NoResult />;
  }

  return (
    <Section className="gap-6" containerClassName="bg-primary-0">
      <h1 className="text-primary-8 mb-0">
        {data.titre ?? "Contacter l'équipe"}
      </h1>

      {!!data.description && (
        <p className="text-xl text-primary-10">{data.description}</p>
      )}

      <ContactForm />

      {!!data.telephone && (
        <Alert
          title={`Tél. : ${data.telephone}`}
          description={data.horaires}
          customIcon="phone-fill"
        />
      )}

      {!!data.couverture && (
        <DEPRECATED_StrapiImage
          data={data.couverture}
          className="w-full"
          containerClassName="w-full my-6"
          displayCaption={data.legendeVisible}
        />
      )}
    </Section>
  );
};

export default Contact;
